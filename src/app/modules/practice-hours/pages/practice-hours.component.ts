import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, filter, takeUntil } from 'rxjs';
import { BadgeColor, NotificationType } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../shared/components/destroyable.component';
import { stringToTimeArray, Weekday } from '../../../shared/models/calendar.model';
import { NotificationDataService } from '../../../core/services/notification-data.service';
import { PracticeAvailabilityServer } from '../../../shared/models/practice.model';
import { PracticeHoursApiService } from '../../../core/services/practice-hours-api.service';

interface TimeDistributed {
  hour: number;
  minute: number;
  second?: number;
}

interface PracticeHourFormValues {
  selectedWeekday: Weekday;
  practiceHours: {
    [key: string]: {
      id?: number;
      weekday: Weekday;
      dayStart: TimeDistributed;
      dayEnd: TimeDistributed;
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

  constructor(private fb: FormBuilder, private notificationSvc: NotificationDataService, private practiceHourApiSvc: PracticeHoursApiService) {
    super();
  }

  public ngOnInit(): void {
    this.practiceHourApiSvc.practiceHours$.pipe(takeUntil(this.destroy$$)).subscribe((practicehours) => {
      this.practiceHoursData$$.next(practicehours);
      this.createForm(practicehours);
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get practiceHourFormValues(): PracticeHourFormValues {
    return this.practiceHourForm.value;
  }

  public get exceptionFormValues(): ExceptionFormValues {
    return this.exceptionForm.value;
  }

  private createForm(practiceHours?: PracticeAvailabilityServer[]): void {
    this.practiceHourForm = this.fb.group({
      selectedWeekday: [this.weekdayEnum.ALL, []],
      practiceHours: this.fb.group({}),
    });

    this.exceptionForm = this.fb.group({
      exception: this.fb.array([this.getExceptionFormGroup()]),
    });

    if (practiceHours?.length) {
      practiceHours.forEach((practice) => {
        this.practiceHourForm.patchValue({ selectedWeekday: practice.weekday });
        this.addPracticeHoursControls(practice);
      });
    } else {
      this.addPracticeHoursControls();
    }
  }

  private getPracticeHoursFormGroup(weekday?: Weekday, dayStart?: TimeDistributed, dayEnd?: TimeDistributed, id?: number): FormGroup {
    const fg = this.fb.group({
      ...(id ? { id: [id ?? 0, []] } : {}),
      weekday: [weekday ?? this.practiceHourFormValues.selectedWeekday, []],
      dayStart: [dayStart, []],
      dayEnd: [dayEnd, []],
      isPriority: [false, []],
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
    switch (weekday) {
      case Weekday.ALL:
        Object.values(this.weekdayEnum).forEach((day) => {
          if (typeof day === 'number' && day > 0) {
            const fa = fg.get(day.toString()) as FormArray;
            if (!fa || !fa.length) {
              fg.addControl(day.toString(), this.fb.array([this.getPracticeHoursFormGroup(day)]));
            }
          }
        });
        break;
      default:
        if (!Object.keys(fg.value)?.length || (Object.keys(fg.value).length && !fg.get(this.practiceHourFormValues.selectedWeekday.toString()))) {
          fg.addControl(
            this.practiceHourFormValues.selectedWeekday.toString(),
            this.fb.array([
              this.getPracticeHoursFormGroup(
                practice?.weekday,
                {
                  hour: stringToTimeArray(practice?.dayStart)[0],
                  minute: stringToTimeArray(practice?.dayStart)[1],
                },
                {
                  hour: stringToTimeArray(practice?.dayEnd)[0],
                  minute: stringToTimeArray(practice?.dayEnd)[1],
                },
                practice?.id,
              ),
            ]),
          );
        } else if (fg.get(this.practiceHourFormValues.selectedWeekday.toString()) && practice) {
          (fg.get(practice.weekday.toString()) as FormArray).push(
            this.getPracticeHoursFormGroup(
              practice.weekday,
              {
                hour: stringToTimeArray(practice?.dayStart)[0],
                minute: stringToTimeArray(practice?.dayStart)[1],
              },
              {
                hour: stringToTimeArray(practice?.dayEnd)[0],
                minute: stringToTimeArray(practice?.dayEnd)[1],
              },
              practice.id,
            ),
          );
        }
    }
  }

  public practiceHoursWeekWiseControlsArray(getAll = false): FormArray[] {
    const controls: FormArray[] = [];

    const fg = this.practiceHourForm.get('practiceHours');
    const { selectedWeekday } = this.practiceHourFormValues;
    let keys = Object.keys(this.practiceHourFormValues.practiceHours);

    if (!getAll) {
      keys = [...keys.filter((key) => key === selectedWeekday.toString() || selectedWeekday === Weekday.ALL)];
    }

    if (keys?.length) {
      keys.forEach((key) => {
        const fa = fg?.get(key) as FormArray;
        if (fa?.length) {
          controls.push(fg?.get(key) as FormArray);
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
    if (this.practiceHourFormValues.selectedWeekday === selectedTab) {
      return 'primary';
    }

    if (selectedTab === 0) {
      for (let i = 1; i <= 7; i++) {
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
    console.log(this.practiceHourFormValues);
    if (this.practiceHourForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.practiceHourForm.updateValueAndValidity();
    }

    const practiceHourRequestData: PracticeAvailabilityServer[] = [
      ...this.practiceHoursWeekWiseControlsArray(true).reduce(
        (acc, formArray) => [
          ...acc,
          ...formArray.controls.reduce((a, control) => {
            if (control.value.dayStart && control.value.dayEnd) {
              console.log('control.value.dayStart: ', control.value.dayStart.hour);
              console.log('control.value.minute: ', control.value.dayStart.minute);
              return [
                ...a,
                {
                  ...control.value,
                  dayStart: `${control.value.dayStart.hour}:${control.value.dayStart.minute}`,
                  dayEnd: `${control.value.dayEnd.hour}:${control.value.dayEnd.minute}`,
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
      .subscribe((resp) => {
        if (resp) {
          this.notificationSvc.showNotification(`${this.practiceHoursData$$.value?.length ? 'Changes updated' : 'Saved'} successfully`);
        }
      });
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
}
