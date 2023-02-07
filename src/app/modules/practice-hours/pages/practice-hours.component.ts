import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, filter, takeUntil } from 'rxjs';
import { BadgeColor, NotificationType } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../shared/components/destroyable.component';
import { Weekday } from '../../../shared/models/calendar.model';
import { NotificationDataService } from '../../../core/services/notification-data.service';
import { PracticeAvailability } from '../../../shared/models/practice.model';
import { PracticeHoursApiService } from '../../../core/services/practice-hours-api.service';

interface TimeDistributed {
  hour: number;
  minute: number;
  second?: number;
}

interface FormValues {
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

@Component({
  selector: 'dfm-practice-hours',
  templateUrl: './practice-hours.component.html',
  styleUrls: ['./practice-hours.component.scss'],
})
export class PracticeHoursComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public practiceHourForm!: FormGroup;

  public practiceHoursData$$ = new BehaviorSubject<PracticeAvailability[]>([]);

  public weekdayEnum = Weekday;

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

  public get formValues(): FormValues {
    return this.practiceHourForm.value;
  }

  private createForm(practiceHours?: PracticeAvailability[]): void {
    this.practiceHourForm = this.fb.group({
      selectedWeekday: [this.weekdayEnum.ALL, []],
      practiceHours: this.fb.group({}),
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
      weekday: [weekday ?? this.formValues.selectedWeekday, []],
      dayStart: [dayStart, []],
      dayEnd: [dayEnd, []],
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

  private addPracticeHoursControls(practice?: PracticeAvailability): void {
    const fg = this.practiceHourForm.get('practiceHours') as FormGroup;
    const weekday = this.formValues.selectedWeekday;
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
        if (!Object.keys(fg.value)?.length || (Object.keys(fg.value).length && !fg.get(this.formValues.selectedWeekday.toString()))) {
          fg.addControl(
            this.formValues.selectedWeekday.toString(),
            this.fb.array([
              this.getPracticeHoursFormGroup(
                practice?.weekday,
                {
                  hour: practice?.dayStart?.getHours() ?? 0,
                  minute: practice?.dayStart?.getMinutes() ?? 0,
                },
                {
                  hour: practice?.dayEnd?.getHours() ?? 0,
                  minute: practice?.dayEnd?.getMinutes() ?? 0,
                },
                practice?.id,
              ),
            ]),
          );
        } else if (fg.get(this.formValues.selectedWeekday.toString()) && practice) {
          (fg.get(practice.weekday.toString()) as FormArray).push(
            this.getPracticeHoursFormGroup(
              practice.weekday,
              {
                hour: practice.dayStart.getHours(),
                minute: practice.dayStart.getMinutes(),
              },
              {
                hour: practice.dayEnd.getHours(),
                minute: practice.dayEnd.getMinutes(),
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
    const { selectedWeekday } = this.formValues;
    let keys = Object.keys(this.formValues.practiceHours);

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
    if (this.formValues.selectedWeekday === selectedWeekday) {
      return;
    }

    // const { weekday } = this.formValues;
    this.practiceHourForm.patchValue({ selectedWeekday });
    this.addPracticeHoursControls();
  }

  public addSlot(controlArray: FormArray) {
    controlArray.push(this.getPracticeHoursFormGroup(this.getFormArrayName(controlArray)));
  }

  public removeSlot(controlArray: FormArray, i: number) {
    controlArray.removeAt(i);
  }

  public getBadgeColor(weekday: Weekday): BadgeColor {
    if (this.formValues.selectedWeekday === weekday) {
      return 'primary';
    }

    if (weekday === Weekday.ALL) {
      for (let i = 1; i <= 7; i++) {
        if (!this.formValues.practiceHours[i.toString()]?.every((pa) => pa?.dayEnd && pa?.dayStart)) {
          return 'gray';
        }
      }

      return 'success';
    }

    const practiceHours = this.formValues.practiceHours[weekday.toString()];
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

    const practiceHourRequestData: PracticeAvailability[] = [
      ...this.practiceHoursWeekWiseControlsArray(true).reduce(
        (acc, formArray) => [
          ...acc,
          ...formArray.controls.reduce((a, control) => {
            if (control.value.dayStart && control.value.dayEnd) {
              return [
                ...a,
                {
                  ...control.value,
                  dayStart: this.timeStringArray(control.value.dayStart),
                  dayEnd: new Date(new Date().setHours(control.value.dayEnd.hour, control.value.dayEnd.minute)),
                },
              ];
            }
            return a;
          }, [] as PracticeAvailability[]),
        ],
        [] as PracticeAvailability[],
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
  timeStringArray(dayStart: any): Date {
    throw new Error('Method not implemented.');
  }
}
