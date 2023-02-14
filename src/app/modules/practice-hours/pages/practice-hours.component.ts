import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, filter, takeUntil } from 'rxjs';
import { BadgeColor, NotificationType } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../shared/components/destroyable.component';
import { Weekday } from '../../../shared/models/calendar.model';
import { NotificationDataService } from '../../../core/services/notification-data.service';
import { PracticeAvailabilityServer } from '../../../shared/models/practice.model';
import { PracticeHoursApiService } from '../../../core/services/practice-hours-api.service';
import { formatTime } from '../../../shared/utils/formatTime';
import { NameValue } from '../../../shared/components/search-modal.component';
import { NameValuePairPipe } from '../../../shared/pipes/name-value-pair.pipe';
import { TimeInIntervalPipe } from '../../../shared/pipes/time-in-interval.pipe';
import { getNumberArray } from '../../../shared/utils/getNumberArray';

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

  public weekdayEnum = Weekday;

  public isExceptionFormSelected = false;

  public timings: NameValue[] = [];

  public readonly interval: number = 5;

  public submitting$$ = new BehaviorSubject<boolean>(false);

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
    let start = '';
    if (dayStart) {
      if (dayStart.toLowerCase().includes('pm')) {
        const s = +dayStart.slice(0, 2);
        if (s < 12) {
          start = `${s + 12}:${dayStart.slice(3, 5)}`;
        }
      } else {
        start = dayStart.slice(0, 5);
      }
    }

    let end = '';
    if (dayEnd) {
      if (dayEnd.toLowerCase().includes('pm')) {
        const e = +dayEnd.slice(0, 2);
        if (e < 12) {
          end = `${e + 12}:${dayEnd.slice(3, 5)}`;
        }
      } else {
        end = dayEnd.slice(0, 5);
      }
    }

    const fg = this.fb.group({
      ...(id ? { id: [id ?? 0, []] } : {}),
      weekday: [weekday ?? this.practiceHourFormValues.selectedWeekday, []],
      dayStart: [start, []],
      dayEnd: [end, []],
      // isPriority: [false, []],
    });

    fg.get('dayStart')
      ?.valueChanges.pipe(
        filter((time) => !!time),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => {
        // this.toggleTimeError(fg.get('dayStart'), fg.get('dayEnd'));
      });

    fg.get('dayEnd')
      ?.valueChanges.pipe(
        filter((time) => !!time),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => {
        // this.toggleTimeError(fg.get('dayStart'), fg.get('dayEnd'));
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
    controlArray.push(this.getPracticeHoursFormGroup(this.getFormArrayName(controlArray)));
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
    if (this.practiceHourForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.practiceHourForm.updateValueAndValidity();
    }

    this.submitting$$.next(true);

    const practiceHourRequestData: PracticeAvailabilityServer[] = [
      ...this.practiceHoursWeekWiseControlsArray(true).reduce(
        (acc, formArray) => [
          ...acc,
          ...formArray.controls.reduce((a, control) => {
            if (control.value.dayStart && control.value.dayEnd) {
              return [
                ...a,
                {
                  ...control.value,
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

  public handleTimeInput(time: string, control: AbstractControl | null | undefined) {
    const formattedTime = formatTime(time, 24, 5);

    if (!formattedTime) {
      return;
    }

    const nameValue = {
      name: formattedTime,
      value: formattedTime,
    };

    if (!this.timings.find((t) => t.value === formattedTime)) {
      this.timings.splice(0, 0, nameValue);
    }

    control?.setValue(formattedTime);
  }
}
