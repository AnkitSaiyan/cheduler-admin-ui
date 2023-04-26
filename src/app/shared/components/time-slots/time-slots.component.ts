import {ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup} from "@angular/forms";
import {Weekday} from "../../models/calendar.model";
import {getNumberArray} from "../../utils/getNumberArray";
import {NameValuePairPipe} from "../../pipes/name-value-pair.pipe";
import {TimeInIntervalPipe} from "../../pipes/time-in-interval.pipe";
import {NameValue} from "../search-modal.component";
import {DestroyableComponent} from "../destroyable.component";
import {BehaviorSubject, debounceTime, filter, Subject, takeUntil} from "rxjs";
import { BadgeColor, InputDropdownComponent, NotificationType } from 'diflexmo-angular-design-dev';
import {GeneralUtils} from "../../utils/general.utils";
import {toggleControlError} from "../../utils/toggleControlError";
import {ENG_BE, TIME_24} from "../../utils/const";
import {NotificationDataService} from "../../../core/services/notification-data.service";
import {Translate} from "../../models/translate.model";
import {ShareDataService} from "../../../core/services/share-data.service";
import {DateTimeUtils} from "../../utils/date-time.utils";

interface TimeSlotFormValues {
  selectedWeekday: Weekday;
  timeSlotGroup: {
    [key: string]: {
      id?: number;
      weekday: Weekday;
      dayStart: string;
      dayEnd: string;
      startTimings: NameValue[];
      endTimings: NameValue[];
    }[];
  }
}

interface TimeSlot {
  id?: number;
  weekday: Weekday;
  dayStart: string;
  dayEnd: string;
}

@Component({
  selector: 'dfm-time-slots',
  templateUrl: './time-slots.component.html',
  styleUrls: ['./time-slots.component.scss']
})
export class TimeSlotsComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public timeSlotForm!: FormGroup;

  private timings: NameValue[] = [];

  private filteredTimings: NameValue[] = [];

  public weekdayEnum = Weekday;

  public readonly invalidTimeError: string = 'invalidTime';

  public readonly invalidSlotRangeError: string = 'invalidSlot';

  public readonly slotExistsError: string = 'slotExists';

  private selectedLang: string = ENG_BE;

  @Input() public interval = 5;

  @Input() public timeSlotData$$ = new BehaviorSubject<TimeSlot[]>([]);

  @Input() public emitEvents$$ = new Subject<void>();

  @Output() public formValuesEvent = new EventEmitter<{ isValid: boolean; values: TimeSlot[] }>()


  constructor(
    private fb: FormBuilder,
    private nameValuePipe: NameValuePairPipe,
    private timeInIntervalPipe: TimeInIntervalPipe,
    private cdr: ChangeDetectorRef,
    private notificationSvc: NotificationDataService,
    private shareDataSvc: ShareDataService
  ) {
    super()
  }

  public ngOnInit(): void {
    this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(this.interval))];
    this.filteredTimings = [...this.timings];

    this.createForm();

    this.timeSlotData$$.pipe(takeUntil(this.destroy$$), filter((d) => !!d?.length)).subscribe({
      next: (timeSlots) => {
        console.log(timeSlots);
        this.updateForm(timeSlots);
      }
    });

    this.emitEvents$$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: () => {
        this.formValuesEvent.emit({
          isValid: this.isFormValid(),
          values: this.getFormRequestBody(this.formValues)
        });
      }
    });

    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe({
        next: (lang) => this.selectedLang = lang
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  private createForm() {
    this.timeSlotForm = this.fb.group({
      selectedWeekday: [Weekday.ALL, []],
      timeSlotGroup: this.getTimeSlotFormGroup(),
    });

    this.timeSlotForm.patchValue({selectedWeekday: Weekday.ALL})
  }

  private getTimeSlotFormGroup(): FormGroup {
    const formGroup = this.fb.group({});

    getNumberArray(6, 0).forEach((weekday) => {
      formGroup.addControl(weekday.toString(), this.fb.array([this.getTimeControlGroup(weekday)]));
    });

    return formGroup;
  }

  private getTimeControlGroup(weekday: string | number): FormGroup {
    const controlGroup = this.fb.group({
      id: [],
      weekday: [weekday.toString(), []],
      dayStart: ['', []],
      dayEnd: ['', []],
      startTimings: [[...this.filteredTimings], []],
      endTimings: [[...this.filteredTimings], []],
    });

    controlGroup.get('dayStart')?.valueChanges.pipe(takeUntil(this.destroy$$), debounceTime(0)).subscribe({
      next: (value) => this.handleError(value as string, controlGroup.get('dayEnd'), controlGroup.value.weekday)
    })
    controlGroup.get('dayEnd')?.valueChanges.pipe(takeUntil(this.destroy$$),debounceTime(0)).subscribe({
      next: (value) => this.handleError(value as string, controlGroup.get('dayStart'), controlGroup.value.weekday)
    })

    return controlGroup;
  }

  public getFormArray(weekday: number | string): FormArray {
    return (this.timeSlotForm.get('timeSlotGroup') as FormGroup).get(weekday.toString()) as FormArray;
  }

  private get allFormArrays(): FormArray[] {
    return getNumberArray(6, 0).map((num) => ((this.timeSlotForm.get('timeSlotGroup') as FormGroup).get(num.toString()) as FormArray))
  }

  public get formValues(): TimeSlotFormValues {
    return this.timeSlotForm.value;
  }

  public getBadgeColor(selectedTab: number): BadgeColor {
    if (this.formValues?.selectedWeekday === selectedTab) {
      return 'secondary';
    }

    if (selectedTab === Weekday.ALL) {
      for (let i = 0; i < 7; i++) {
        if (!this.formValues.timeSlotGroup[i.toString()]?.every((pa) => pa?.dayEnd && pa?.dayStart)) {
          return 'gray';
        }
      }

      return 'gray';
    }

    const practiceHours = this.formValues.timeSlotGroup[selectedTab.toString()];
    if (practiceHours?.length && practiceHours.every((pa) => pa.dayEnd && pa.dayStart)) {
      return 'primary';
    }

    return 'gray';
  }

  public selectWeekday(weekday: Weekday) {
    if (this.formValues.selectedWeekday !== weekday) {
      this.timeSlotForm.patchValue({selectedWeekday: weekday});
      this.cdr.detectChanges();
    }
  }

  public removeSlot(weekday: number, i: number) {
    const fa = this.getFormArray(weekday);

    if (fa.length === 1) {
      fa.controls[i].patchValue({
        dayStart: null, dayEnd: null
      });

      return;
    }

    fa.removeAt(i);

    const formArrays = this.getFormArray(weekday.toString());
    this.handleInvalidSlotRangeError([formArrays]);
    this.handleSlotExistsError([formArrays]);
  }

  public addSlot(weekday: number) {
    const fa = this.getFormArray(weekday);
    if (fa.controls.every((control) => control.value.dayStart && control.value.dayEnd)) {
      fa.push(this.getTimeControlGroup(weekday));
    } else {
      this.notificationSvc.showNotification(Translate.FillSlot[this.selectedLang], NotificationType.WARNING);
    }
  }

  private updateForm(timeSlots: TimeSlot[]) {
    const weekdaySet = new Set();

    timeSlots.forEach((timeSlot) => {
      const fa = this.getFormArray(timeSlot.weekday);

      if (!weekdaySet.has(timeSlot.weekday)) {
        fa.clear();
        weekdaySet.add(timeSlot.weekday);
      }

      fa.push(this.getTimeControlGroup(timeSlot.weekday));

      const control = fa.at(fa.length - 1);

      if (control) {
        // To defer value update at end
        setTimeout(() => {
          this.patchUpdatedValues(control, timeSlot)
        }, 0);
      }
    });


    this.cdr.detectChanges();
  }

  private patchUpdatedValues(control: AbstractControl<any>, timeSlot: TimeSlot) {
    console.log(timeSlot.dayStart, timeSlot.dayEnd)
    console.log(DateTimeUtils.TimeStringIn24Hour(timeSlot.dayStart), DateTimeUtils.TimeStringIn24Hour(timeSlot.dayEnd));
    control.patchValue({
      id: timeSlot.id,
      dayStart: DateTimeUtils.TimeStringIn24Hour(timeSlot.dayStart),
      dayEnd: DateTimeUtils.TimeStringIn24Hour(timeSlot.dayEnd),
      weekday: timeSlot.weekday,
    }, {emitEvent: false});
  }

  private formatInputTime(
    time: string,
    control: AbstractControl | null | undefined,
    timingValueControl: AbstractControl | null | undefined,
    eleRef: InputDropdownComponent,
  ) {
    const formattedTime = DateTimeUtils.FormatTime(time, 24, 5);

    if (!formattedTime) {
      return;
    }

    const nameValue = {
      name: formattedTime,
      value: formattedTime,
    };

    if (!timingValueControl?.value?.find((t) => t?.value === formattedTime)) {
      timingValueControl?.setValue(timingValueControl?.value?.splice(0, 0, nameValue));
    }

    control?.setValue(formattedTime);
  }

  private searchTime(time: string, timingValueControl: AbstractControl | null | undefined) {
    timingValueControl?.setValue([...GeneralUtils.FilterArray(this.timings, time, 'value')]);
  }

  public handleTimeInput(
    time: string,
    control: AbstractControl | null | undefined,
    timingValueControl: AbstractControl | null | undefined,
    eleRef: InputDropdownComponent,
  ) {
    this.formatInputTime(time, control, timingValueControl, eleRef);
    this.searchTime(time, timingValueControl);
  }

  private handleInvalidTimeError(time: string, control: AbstractControl | null | undefined) {
    if (!time) {
      toggleControlError(control, this.invalidTimeError, false);
      return;
    }

    if (!time.match(TIME_24)) {
      toggleControlError(control, this.invalidTimeError);
      return;
    }

    toggleControlError(control, this.invalidTimeError, false);
  }

  private handleInvalidSlotRangeError(controlArrays: FormArray[]) {
    for (let i = 0; i < controlArrays.length; i++) {
      for (let j = 0; j < controlArrays[i].length; j++) {
        const dayStart = controlArrays[i].controls[j].get('dayStart');
        const dayEnd = controlArrays[i].controls[j].get('dayEnd');

        if (dayStart?.value && dayEnd?.value) {
          if (DateTimeUtils.TimeToNumber(dayStart.value) >= DateTimeUtils.TimeToNumber(dayEnd?.value)) {
            toggleControlError(dayStart, this.invalidSlotRangeError);
            toggleControlError(dayEnd, this.invalidSlotRangeError);
            return;
          }
        }

        toggleControlError(dayStart, this.invalidSlotRangeError, false);
        toggleControlError(dayEnd, this.invalidSlotRangeError, false);
      }
    }
  }

  private handleSlotExistsError(controlArrays: FormArray[]) {
    controlArrays.forEach((formArray) => {
      const controls = formArray.controls;
      if (formArray.length > 1) {
        // const sortedControls = [...controls].sort((a, b) => DateTimeUtils.TimeToNumber(a.value.daysStart) - DateTimeUtils.TimeToNumber(b.value.dayStart));

        for (let i = 0; i < formArray.length - 1; i++) {
          const compareWithControl = controls[i];

          for (let j = i + 1; j < formArray.length; j++) {
            const currControl = controls[j];

            if (currControl.value.dayStart && currControl.value.dayEnd) {
              if (DateTimeUtils.CheckTimeRangeOverlapping(compareWithControl.value.dayStart, compareWithControl.value.dayEnd, currControl.value.dayStart, currControl.value.dayEnd)) {
                toggleControlError(currControl.get('dayStart'), this.slotExistsError);
                toggleControlError(currControl.get('dayEnd'), this.slotExistsError);
                toggleControlError(compareWithControl.get('dayStart'), this.slotExistsError);
                toggleControlError(compareWithControl.get('dayEnd'), this.slotExistsError);
              } else {
                toggleControlError(currControl.get('dayStart'), this.slotExistsError, false);
                toggleControlError(currControl.get('dayEnd'), this.slotExistsError, false);
                toggleControlError(compareWithControl.get('dayStart'), this.slotExistsError, false);
                toggleControlError(compareWithControl.get('dayEnd'), this.slotExistsError, false);
              }
            }
          }
        }
      } else if (formArray.length === 1) {
        toggleControlError(controls[0].get('dayStart'), this.slotExistsError, false);
        toggleControlError(controls[0].get('dayEnd'), this.slotExistsError, false);
      }
    });
  }

  private handleError(time: string, control: AbstractControl | null | undefined, weekday: string | number | null | undefined) {
    //  Handling invalid time input
    this.handleInvalidTimeError(time, control);

    // Handling slot errors
    if (weekday) {
      const controlArrays = this.getFormArray(weekday.toString());
      this.handleInvalidSlotRangeError([controlArrays]);
      this.handleSlotExistsError([controlArrays]);
    }
  }

  public handleTimeFocusOut(time: string, control: AbstractControl | null | undefined, weekday: string | number) {
    this.handleError(time, control, weekday);
  }

  public isFormValid(): boolean {
    const formArrays = this.allFormArrays;
    for (let i = 0; i < formArrays.length; i++) {
      for (let j = 0; j < formArrays[i].length; j++) {
        const controls = formArrays[i].controls[j] as AbstractControl;

        if (controls.invalid) {
          return false;
        }

        if ((controls.value.dayStart && !controls.value.dayEnd) || (!controls.value.dayStart && controls.value.dayEnd)) {
          return false;
        }
      }
    }

    return true;
  }

  private getFormRequestBody(formValues: TimeSlotFormValues): TimeSlot[] {
    const timeSlots: TimeSlot[] = [];

    Object.values(formValues.timeSlotGroup).forEach((values) => {
      values.forEach((value) => {
        if (value.dayStart && value.dayEnd) {
          timeSlots.push({
            dayStart: DateTimeUtils.LocalToUTCTimeTimeString(value.dayStart),
            dayEnd: DateTimeUtils.LocalToUTCTimeTimeString(value.dayEnd),
            weekday: value.weekday,
            ...(value.id ? { id: value.id } : {})
          });
        }
      })
    });

    return timeSlots;
  }

}

