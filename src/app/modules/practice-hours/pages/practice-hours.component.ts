import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {BehaviorSubject, debounceTime, takeUntil} from 'rxjs';
import {BadgeColor, InputDropdownComponent, NotificationType} from 'diflexmo-angular-design';
import {DestroyableComponent} from '../../../shared/components/destroyable.component';
import {Weekday} from '../../../shared/models/calendar.model';
import {NotificationDataService} from '../../../core/services/notification-data.service';
import {PracticeAvailabilityServer} from '../../../shared/models/practice.model';
import {PracticeHoursApiService} from '../../../core/services/practice-hours-api.service';
import {checkTimeRangeOverlapping, formatTime, get24HourTimeString, timeToNumber} from '../../../shared/utils/time';
import {NameValue} from '../../../shared/components/search-modal.component';
import {NameValuePairPipe} from '../../../shared/pipes/name-value-pair.pipe';
import {TimeInIntervalPipe} from '../../../shared/pipes/time-in-interval.pipe';
import {getNumberArray} from '../../../shared/utils/getNumberArray';
import {toggleControlError} from '../../../shared/utils/toggleControlError';
import {TIME_24} from '../../../shared/utils/const';
import {Translate} from '../../../shared/models/translate.model';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {COMING_FROM_ROUTE, EDIT, EXAM_ID, ENG_BE, DUTCH_BE, Statuses, StatusesNL} from '../../../shared/utils/const';
import {GeneralUtils} from "../../../shared/utils/general.utils";

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

  private selectedLang: string = ENG_BE;

  constructor(
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private practiceHourApiSvc: PracticeHoursApiService,
    private nameValuePipe: NameValuePairPipe,
    private timeInIntervalPipe: TimeInIntervalPipe,
    private cdr: ChangeDetectorRef,
    private shareDataSvc: ShareDataService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.createForm();

    this.practiceHourApiSvc.practiceHours$.pipe(takeUntil(this.destroy$$)).subscribe((practiceHours) => {
      this.practiceHoursData$$.next(practiceHours);
      this.createPracticeControls(practiceHours);
    });

    this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(this.interval))];
    this.filteredTimings = [...this.timings];
    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => {
        this.selectedLang = lang;
        // this.columns = [
        //   Translate.FirstName[lang],
        //   Translate.LastName[lang],
        //   Translate.Email[lang],
        //   Translate.Telephone[lang],
        //   Translate.Category[lang],
        //   Translate.Status[lang],
        //   Translate.Actions[lang],
        // ];

        // eslint-disable-next-line default-case
      });
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
      practiceHours.sort((p1, p2) => p1.weekday - p2.weekday);

      practiceHours.forEach((practice) => {
        this.practiceHourForm.patchValue({selectedWeekday: practice.weekday});
        this.addPracticeHoursControls(practice);
        if (weekdays.has(practice.weekday)) {
          weekdays.delete(practice.weekday);
        }
      });

      weekdays.forEach((weekday) => {
        this.practiceHourForm.patchValue({selectedWeekday: weekday});
        this.addPracticeHoursControls();
      });

      this.practiceHourForm.patchValue({selectedWeekday: Weekday.ALL});
    } else {
      this.addPracticeHoursControls();
    }

    this.cdr.detectChanges();

    // if (practiceHours) {
    //   const formArrays = this.practiceHoursWeekWiseControlsArray(true);
    //   this.handleSlotExistsError(formArrays);
    // }
  }

  private getPracticeHoursFormGroup(weekday?: Weekday, dayStart?: string, dayEnd?: string, id?: number): FormGroup {
    const fg = this.fb.group({
      ...(id ? {id: [id ?? 0, []]} : {}),
      weekday: [weekday ?? this.practiceHourFormValues.selectedWeekday, []],
      dayStart: [get24HourTimeString(dayStart), []],
      dayEnd: [get24HourTimeString(dayEnd), []],
      startTimings: [this.filteredTimings, []],
      endTimings: [this.filteredTimings, []],
    });

    fg.get('dayStart')
      ?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe((value) => {
        this.handleError(value as string, fg.get('dayStart'));
      });

    fg.get('dayEnd')
      ?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe((value) => {
        this.handleError(value as string, fg.get('dayEnd'));
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
    const {selectedWeekday} = this.practiceHourFormValues;
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
    this.practiceHourForm.patchValue({selectedWeekday});
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
    if (controlArray.length === 1) {
      controlArray.controls[i].patchValue({
        dayStart: null,
        dayEnd: null,
      });
      return;
    }
    controlArray.removeAt(i);

    const formArrays = this.practiceHoursWeekWiseControlsArray(true);
    this.handleInvalidSlotRangeError(formArrays);
    this.handleSlotExistsError(formArrays);
  }

  public getBadgeColor(selectedTab: number): BadgeColor {
    if (this.practiceHourFormValues?.selectedWeekday === selectedTab) {
      return 'secondary';
    }

    if (selectedTab === Weekday.ALL) {
      for (let i = 0; i < 7; i++) {
        if (!this.practiceHourFormValues.practiceHours[i.toString()]?.every((pa) => pa?.dayEnd && pa?.dayStart)) {
          return 'primary';
        }
      }

      return 'gray';
    }

    const practiceHours = this.practiceHourFormValues.practiceHours[selectedTab.toString()];
    if (practiceHours?.length && practiceHours.every((pa) => pa.dayEnd && pa.dayStart)) {
      return 'gray';
    }

    return 'primary';
  }

  public savePracticeHours(): void {
    const controlArrays: FormArray[] = this.practiceHoursWeekWiseControlsArray(true);

    if (this.isFormInvalid(controlArrays)) {
      this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
      return;
    }


    let valid = true;

    const practiceHourRequestData: PracticeAvailabilityServer[] = [
      ...controlArrays.reduce(
        (acc, formArray) => [
          ...acc,
          ...formArray.controls.reduce((a, control) => {
            if (valid && (((control.value.dayStart && !control.value.dayEnd) || (!control.value.dayStart && control.value.dayEnd)) || control.get('dayStart')?.errors)) {
              valid = false;
            }

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


    if (!valid) {
      this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
      return;
    }

    this.submitting$$.next(true);


    this.practiceHourApiSvc
      .savePracticeHours$(practiceHourRequestData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(
        () => {
          if (this.practiceHoursData$$.value?.length) {
            this.notificationSvc.showNotification(Translate.SuccessMessage.Updated[this.selectedLang]);
          } else {
            this.notificationSvc.showNotification(Translate.SuccessMessage.Added[this.selectedLang]);
          }
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

  public handleTimeInput(
    time: string,
    control: AbstractControl | null | undefined,
    timingValueControl: AbstractControl | null | undefined,
    eleRef: InputDropdownComponent,
  ) {

    console.log(time)
    this.formatTime(time, control, timingValueControl, eleRef);
    this.searchTime(time, timingValueControl);
  }

  public handleTimeFocusOut(time: string, control: AbstractControl | null | undefined) {
    this.handleError(time, control);
  }

  private searchTime(time: string, timingValueControl: AbstractControl | null | undefined) {
    timingValueControl?.setValue([...GeneralUtils.FilterArray(this.timings, time, 'value')]);
  }

  private handleError(time: string, control: AbstractControl | null | undefined) {
    //  Handling invalid time input
    this.handleInvalidTimeError(time, control);

    // Handling slot errors
    const controlArrays = this.practiceHoursWeekWiseControlsArray(true);
    this.handleInvalidSlotRangeError(controlArrays);
    this.handleSlotExistsError(controlArrays);
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
  }

  private handleSlotExistsError(controlArrays: FormArray[]) {
    controlArrays.forEach((formArray) => {
      const controls = formArray.controls;
      if (formArray.length > 1) {
        // const sortedControls = [...controls].sort((a, b) => timeToNumber(a.value.daysStart) - timeToNumber(b.value.dayStart));

        for (let i = 0; i < formArray.length - 1; i++) {
          const compareWithControl = controls[i];

          for (let j = i + 1; j < formArray.length; j++) {
            const currControl = controls[j];

            if (currControl.value.dayStart && currControl.value.dayEnd) {
              // console.log(i, j)
              if (checkTimeRangeOverlapping(compareWithControl.value.dayStart, compareWithControl.value.dayEnd, currControl.value.dayStart, currControl.value.dayEnd)) {
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
