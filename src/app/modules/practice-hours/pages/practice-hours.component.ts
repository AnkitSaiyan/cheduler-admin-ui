import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { BadgeColor, InputDropdownComponent, NotificationType } from 'diflexmo-angular-design';
import { log10 } from 'chart.js/helpers';
import { DestroyableComponent } from '../../../shared/components/destroyable.component';
import { Weekday } from '../../../shared/models/calendar.model';
import { NotificationDataService } from '../../../core/services/notification-data.service';
import { PracticeAvailabilityServer } from '../../../shared/models/practice.model';
import { PracticeHoursApiService } from '../../../core/services/practice-hours-api.service';
import { checkTimeRangeOverlapping, formatTime, get24HourTimeString, timeToNumber } from '../../../shared/utils/time';
import { NameValue } from '../../../shared/components/search-modal.component';
import { NameValuePairPipe } from '../../../shared/pipes/name-value-pair.pipe';
import { TimeInIntervalPipe } from '../../../shared/pipes/time-in-interval.pipe';
import { getNumberArray } from '../../../shared/utils/getNumberArray';
import { toggleControlError } from '../../../shared/utils/toggleControlError';
import { TIME_24 } from '../../../shared/utils/const';

// interface TimeDistributed {
//   hour: number;
//   minute: number;
//   second?: number;
// }

interface PracticeHourFormValues {
  selectedWeekday: Weekday;
  practiceHours: {
    [key: string]: {
      id?: number;
      weekday: Weekday;
      dayStart: string;
      dayEnd: string;
      startTimings: NameValue[];
      endTimings: NameValue[];
    }[];
  };
}

interface ExceptionFormValues {
  exception: {
    date: {
      day: number;
      month: number;
      year: number;
    };
    startTime: {
      hour: number;
      minute: number;
    };
    endTime: {
      hour: number;
      minute: number;
    };
  }[];
}

@Component({
  selector: 'dfm-practice-hours',
  templateUrl: './practice-hours.component.html',
  styleUrls: ['./practice-hours.component.scss'],
})
export class PracticeHoursComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public practiceHourForm!: FormGroup;

  public exceptionForm!: FormGroup;

  public practiceHoursData$$ = new BehaviorSubject<PracticeAvailabilityServer[]>([]);

  public submitting$$ = new BehaviorSubject<boolean>(false);

  public weekdayEnum = Weekday;

  public isExceptionFormSelected = false;

  public timings: NameValue[] = [];

  public filteredTimings: NameValue[] = [];

  public readonly interval: number = 5;

  public readonly invalidTimeError: string = 'invalidTime';

  public readonly invalidSlotRangeError: string = 'invalidSlot';

  public readonly slotExistsError: string = 'slotExists';

  constructor(
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private practiceHourApiSvc: PracticeHoursApiService,
    private nameValuePipe: NameValuePairPipe,
    private timeInIntervalPipe: TimeInIntervalPipe,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.createForm();

    this.practiceHourApiSvc.practiceHours$.pipe(takeUntil(this.destroy$$)).subscribe((practiceHours) => {
      console.log(practiceHours);
      this.practiceHoursData$$.next(practiceHours);
      this.createPracticeControls(practiceHours);
    });

    this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(this.interval))];
    this.filteredTimings = [...this.timings];
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get practiceHourFormValues(): PracticeHourFormValues {
    return this.practiceHourForm?.value;
  }

  public get exceptionFormValues(): ExceptionFormValues {
    return this.exceptionForm.value;
  }

  private createForm(): void {
    if (!this.practiceHourForm) {
      this.practiceHourForm = this.fb.group({
        selectedWeekday: [this.weekdayEnum.ALL, []],
        practiceHours: this.fb.group({}),
      });
    }

    if (!this.exceptionForm) {
      this.exceptionForm = this.fb.group({
        exception: this.fb.array([this.getExceptionFormGroup()]),
      });
    }
  }

  private createPracticeControls(practiceHours?: PracticeAvailabilityServer[]) {
    const weekdays = new Set([0, 1, 2, 3, 4, 5, 6]);

    if (practiceHours?.length) {
      // this.practiceHourForm.removeControl('practiceHours');
      // this.practiceHourForm.addControl('practiceHours', this.fb.group({}));
      practiceHours.sort((p1, p2) => p1.weekday - p2.weekday);

      practiceHours.forEach((practice) => {
        this.practiceHourForm.patchValue({ selectedWeekday: practice.weekday });
        this.addPracticeHoursControls(practice);
        if (weekdays.has(practice.weekday)) {
          weekdays.delete(practice.weekday);
        }
      });

      weekdays.forEach((weekday) => {
        this.practiceHourForm.patchValue({ selectedWeekday: weekday });
        this.addPracticeHoursControls();
      });

      this.practiceHourForm.patchValue({ selectedWeekday: Weekday.ALL });
    } else {
      this.addPracticeHoursControls();
    }
  }

  private getPracticeHoursFormGroup(weekday?: Weekday, dayStart?: string, dayEnd?: string, id?: number): FormGroup {
    const fg = this.fb.group({
      ...(id ? { id: [id ?? 0, []] } : {}),
      weekday: [weekday ?? this.practiceHourFormValues.selectedWeekday, []],
      dayStart: [get24HourTimeString(dayStart), []],
      dayEnd: [get24HourTimeString(dayEnd), []],
      startTimings: [this.filteredTimings, []],
      endTimings: [this.filteredTimings, []],
      // isPriority: [false, []],
    });

    return fg;
  }

  private addPracticeHoursControls(practice?: PracticeAvailabilityServer): void {
    const fg = this.practiceHourForm.get('practiceHours') as FormGroup;
    const weekday = this.practiceHourFormValues.selectedWeekday;

    if (weekday === Weekday.ALL) {
      getNumberArray(6).forEach((day) => {
        const fa = fg.get(day.toString()) as FormArray;
        if (!fa || !fa.length) {
          fg.addControl(day.toString(), this.fb.array([this.getPracticeHoursFormGroup(day)]));
        }
      });

      const fa = fg.get('0') as FormArray;
      if (!fa || !fa.length) {
        fg.addControl('0'.toString(), this.fb.array([this.getPracticeHoursFormGroup(0)]));
      }
    } else if (!Object.keys(fg.value)?.length || (Object.keys(fg.value).length && !fg.get(this.practiceHourFormValues.selectedWeekday.toString()))) {
      fg.addControl(
        this.practiceHourFormValues.selectedWeekday.toString(),
        this.fb.array([this.getPracticeHoursFormGroup(practice?.weekday, practice?.dayStart, practice?.dayEnd, practice?.id)]),
      );
    } else if (fg.get(this.practiceHourFormValues.selectedWeekday.toString()) && practice) {
      (fg.get(practice.weekday.toString()) as FormArray).push(
        this.getPracticeHoursFormGroup(practice.weekday, practice?.dayStart, practice?.dayEnd, practice.id),
      );
    }
  }

  public practiceHoursWeekWiseControlsArray(getAll = false, column: 1 | 2 | 0 = 0): FormArray[] {
    const controls: FormArray[] = [];

    const fg = this.practiceHourForm.get('practiceHours');
    const { selectedWeekday } = this.practiceHourFormValues;
    let keys = [1, 2, 3, 4, 5, 6, 0];

    if (!getAll) {
      if (selectedWeekday === Weekday.ALL) {
        switch (column) {
          case 1:
            keys = [1, 2, 3, 4];
            break;
          default:
            keys = [5, 6, 0];
            break;
        }
      } else {
        keys = [selectedWeekday];
      }
    }

    if (keys?.length) {
      keys.forEach((key) => {
        const fa = fg?.get(key.toString()) as FormArray;
        if (fa?.length) {
          controls.push(fg?.get(key.toString()) as FormArray);
        }
      });
    }

    return controls;
  }

  public getFormArrayName(controlArray: FormArray): Weekday {
    return controlArray.value[0].weekday;
  }

  public selectWeekday(selectedWeekday: Weekday): void {
    if (this.practiceHourFormValues.selectedWeekday === selectedWeekday) {
      return;
    }

    // const { weekday } = this.practiceHourFormValues;
    this.practiceHourForm.patchValue({ selectedWeekday });
    this.addPracticeHoursControls();
    this.isExceptionFormSelected = false;
  }

  public addSlot(controlArray: FormArray) {
    if (controlArray.controls.every((control) => control.value.dayStart && control.value.dayEnd)) {
      controlArray.push(this.getPracticeHoursFormGroup(this.getFormArrayName(controlArray)));
    } else {
      this.notificationSvc.showNotification('Please fill current slot before adding new', NotificationType.WARNING);
    }
  }

  public removeSlot(controlArray: FormArray, i: number) {
    controlArray.removeAt(i);
  }

  public getBadgeColor(selectedTab: number): BadgeColor {
    if (this.practiceHourFormValues?.selectedWeekday === selectedTab) {
      return 'primary';
    }

    if (selectedTab === Weekday.ALL) {
      for (let i = 0; i < 7; i++) {
        if (!this.practiceHourFormValues.practiceHours[i.toString()]?.every((pa) => pa?.dayEnd && pa?.dayStart)) {
          return 'gray';
        }
      }

      return 'success';
    }

    if (+selectedTab === 8) {
      const formArray = this.exceptionFormArray;
      if (formArray.controls.every((control) => control.value.date?.day && control.value.startTime?.hour && control.value.endTime?.hour)) {
        return 'success';
      }
    }

    const practiceHours = this.practiceHourFormValues.practiceHours[selectedTab.toString()];
    if (practiceHours?.length && practiceHours.every((pa) => pa.dayEnd && pa.dayStart)) {
      return 'success';
    }

    return 'gray';
  }

  public savePracticeHours(): void {
    const controlArrays: FormArray[] = this.practiceHoursWeekWiseControlsArray(true);

    if (this.isFormInvalid(controlArrays)) {
      this.notificationSvc.showNotification('Form is not valid.', NotificationType.WARNING);
      // this.practiceHourForm.markAsTouched();
    }

    this.submitting$$.next(true);

    const practiceHourRequestData: PracticeAvailabilityServer[] = [
      ...controlArrays.reduce(
        (acc, formArray) => [
          ...acc,
          ...formArray.controls.reduce((a, control) => {
            if (control.value.dayStart && control.value.dayEnd) {
              return [
                ...a,
                {
                  weekday: control.value.weekday,
                  dayStart: control.value.dayStart,
                  dayEnd: control.value.dayEnd,
                },
              ];
            }
            return a;
          }, [] as PracticeAvailabilityServer[]),
        ],
        [] as PracticeAvailabilityServer[],
      ),
    ];

    console.log(practiceHourRequestData);

    this.practiceHourApiSvc
      .savePracticeHours$(practiceHourRequestData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(
        () => {
          this.notificationSvc.showNotification(`${this.practiceHoursData$$.value?.length ? 'Changes updated' : 'Saved'} successfully`);
          this.submitting$$.next(false);
        },
        () => this.submitting$$.next(false),
      );
  }

  private isFormInvalid(controlArrays: FormArray[]): boolean {
    for (let i = 0; i < controlArrays.length; i++) {
      for (let j = 0; j < controlArrays[i].length; j++) {
        if (controlArrays[i].controls[j].get('dayStart')?.errors || controlArrays[i].controls[j].get('dayEnd')?.errors) {
          return true;
        }
      }
    }

    return false;
  }

  public handleRadioButtonClick(controlArray: FormArray, controls: AbstractControl<any>) {
    console.log('in`');
    controlArray.controls.forEach((control) => control.patchValue({ isPriority: false }));
    controls.get('isPriority')?.setValue(true);
  }

  private getExceptionFormGroup() {
    const fg = this.fb.group({
      date: [
        {
          day: null,
          month: null,
          year: null,
        },
        [],
      ],
      startTime: [
        {
          hour: null,
          minute: null,
        },
        [],
      ],
      endTime: [
        {
          hour: null,
          minute: null,
        },
        [],
      ],
    });

    return fg;
  }

  public get exceptionFormArray(): FormArray {
    return this.exceptionForm.get('exception') as FormArray;
  }

  public addExceptionSlot() {
    this.exceptionFormArray.push(this.getExceptionFormGroup());
  }

  public removeExceptionSlot(i: number) {
    this.exceptionFormArray.removeAt(i);
  }

  public selectExceptionForm() {
    this.isExceptionFormSelected = true;
    this.practiceHourForm.patchValue({ selectedWeekday: 8 });
  }

  public handleTimeInput(
    time: string,
    control: AbstractControl | null | undefined,
    timingValueControl: AbstractControl | null | undefined,
    eleRef: InputDropdownComponent,
  ) {
    this.formatTime(time, control, timingValueControl, eleRef);
    this.searchTime(time, timingValueControl);
  }

  public handleTimeFocusOut(time: string, control: AbstractControl | null | undefined) {
    this.handleError(time, control);
  }

  private searchTime(time: string, timingValueControl: AbstractControl | null | undefined) {
    if (!time) {
      return;
    }

    timingValueControl?.setValue([...this.timings.filter((timing) => timing.value.includes(time))]);
  }

  private handleError(time: string, control: AbstractControl | null | undefined) {
    //  Handling invalid time input

    if (!time) {
      toggleControlError(control, this.invalidTimeError, false);
      return;
    }

    if (!time.match(TIME_24)) {
      toggleControlError(control, this.invalidTimeError);
      return;
    }

    toggleControlError(control, this.invalidTimeError, false);

    // Handling slot errors

    const controlArrays = this.practiceHoursWeekWiseControlsArray(true);

    for (let i = 0; i < controlArrays.length; i++) {
      for (let j = 0; j < controlArrays[i].length; j++) {
        const dayStart = controlArrays[i].controls[j].get('dayStart');
        const dayEnd = controlArrays[i].controls[j].get('dayEnd');

        if (dayStart?.value && dayEnd?.value) {
          if (timeToNumber(dayStart.value) >= timeToNumber(dayEnd?.value)) {
            toggleControlError(dayStart, this.invalidSlotRangeError);
            toggleControlError(dayEnd, this.invalidSlotRangeError);
            return;
          }
        }

        toggleControlError(dayStart, this.invalidSlotRangeError, false);
        toggleControlError(dayEnd, this.invalidSlotRangeError, false);
      }
    }

    controlArrays.forEach((formArray) => {
      const { controls } = formArray;
      if (formArray.length > 1 && controls[1].value.dayStart && controls[1].value.dayEnd) {
        const sortedControls = [...controls].sort((a, b) => timeToNumber(a.value.daysStart) - timeToNumber(b.value.dayStart));

        const first = sortedControls[0];

        for (let j = 1; j < formArray.length; j++) {
          const curr = sortedControls[j];

          if (curr.value.dayStart && curr.value.dayEnd) {
            if (checkTimeRangeOverlapping(first.value.dayStart, first.value.dayEnd, curr.value.dayStart, curr.value.dayEnd)) {
              toggleControlError(curr.get('dayStart'), this.slotExistsError);
              toggleControlError(curr.get('dayEnd'), this.slotExistsError);
              toggleControlError(first.get('dayStart'), this.slotExistsError);
              toggleControlError(first.get('dayEnd'), this.slotExistsError);
            } else {
              toggleControlError(curr.get('dayStart'), this.slotExistsError, false);
              toggleControlError(curr.get('dayEnd'), this.slotExistsError, false);
              toggleControlError(first.get('dayStart'), this.slotExistsError, false);
              toggleControlError(first.get('dayEnd'), this.slotExistsError, false);
            }
          }
        }
      }
    });
  }

  private formatTime(
    time: string,
    control: AbstractControl | null | undefined,
    timingValueControl: AbstractControl | null | undefined,
    eleRef: InputDropdownComponent,
  ) {
    // debugger;
    const formattedTime = formatTime(time, 24, 5);

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
}
