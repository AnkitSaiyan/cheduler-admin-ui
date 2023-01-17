import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs';
import { BadgeColor, NotificationType } from 'diflexmo-angular-design';
import { ActivatedRoute, Router } from '@angular/router';
import { User, UserType } from '../../../../shared/models/user.model';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { Weekday } from '../../../../shared/models/calendar.model';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { AddStaffRequestData } from '../../../../shared/models/staff.model';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { COMING_FROM_ROUTE, EDIT, STAFF_ID } from '../../../../shared/utils/const';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { PracticeAvailability } from '../../../../shared/models/practice.model';

interface TimeDistributed {
  hour: number;
  minute: number;
  second?: number;
}

interface FormValues {
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  address: string;
  userType: UserType;
  practiceAvailabilityToggle?: boolean;
  practiceAvailability: {
    [key: string]: {
      weekday: Weekday;
      dayStart: TimeDistributed;
      dayEnd: TimeDistributed;
    }[];
  };
  examLists: number[];
  selectedWeekday: Weekday;
  info: string;
}

@Component({
  selector: 'dfm-staff-add',
  templateUrl: './staff-add.component.html',
  styleUrls: ['./staff-add.component.scss'],
})
export class StaffAddComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public addStaffForm!: FormGroup;

  public exams$$ = new BehaviorSubject<any[]>([]);

  public generalUserTypes$$ = new BehaviorSubject<any[]>([]);

  public staffDetails$$ = new BehaviorSubject<User | undefined>(undefined);

  public loading$$ = new BehaviorSubject(false);

  public weekdayEnum = Weekday;

  public comingFromRoute = '';

  public staffID!: number;

  public edit = false;

  constructor(
    private fb: FormBuilder,
    private userApiSvc: UserApiService,
    private examApiSvc: ExamApiService,
    private staffApiSvc: StaffApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private routerStateSvc: RouterStateService,
  ) {
    super();
    const state = this.router.getCurrentNavigation()?.extras?.state;
    if (state !== undefined) {
      this.loading$$.next(true);
      this.comingFromRoute = state[COMING_FROM_ROUTE];
      this.edit = state[EDIT];

      localStorage.setItem(COMING_FROM_ROUTE, this.comingFromRoute);
      if (typeof this.edit === 'boolean') {
        localStorage.setItem(EDIT, this.edit.toString());
      }
    } else {
      this.loading$$.next(true);
      this.getComingFromRouteFromLocalStorage();
    }
  }

  private getComingFromRouteFromLocalStorage() {
    const comingFromRoute = localStorage.getItem(COMING_FROM_ROUTE);
    if (comingFromRoute) {
      this.comingFromRoute = comingFromRoute;
    }
    const edit = localStorage.getItem(EDIT);
    if (edit) {
      this.edit = edit === 'true';
    }
  }

  public ngOnInit(): void {
    this.routerStateSvc
      .listenForParamChange$(STAFF_ID)
      .pipe(
        tap((staffID) => (this.staffID = +staffID)),
        switchMap((staffID) => this.staffApiSvc.getStaffByID(+staffID)),
      )
      .subscribe((staffDetails) => {
        this.createForm(staffDetails);
        this.loading$$.next(false);
        this.staffDetails$$.next(staffDetails);
      });

    this.userApiSvc.generalUserTypes.pipe(takeUntil(this.destroy$$)).subscribe((generalUserTypes) => {
      this.generalUserTypes$$.next(generalUserTypes);
    });

    this.examApiSvc.exams$
      .pipe(
        map((exams) => exams.map(({ name, id }) => ({ name, value: id }))),
        takeUntil(this.destroy$$),
      )
      .subscribe((exams) => {
        this.exams$$.next(exams);
      });

    this.addStaffForm
      .get('practiceAvailabilityToggle')
      ?.valueChanges.pipe(
        filter((value: boolean) => value),
        distinctUntilChanged(),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => this.addPracticeAvailabilityControls());
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
    localStorage.removeItem(COMING_FROM_ROUTE);
    localStorage.removeItem(EDIT);
  }

  private createForm(staffDetails?: User | undefined): void {
    this.addStaffForm = this.fb.group({
      firstname: [staffDetails?.firstname, [Validators.required]],
      lastname: [staffDetails?.lastname, [Validators.required]],
      email: [staffDetails?.email, [Validators.required]],
      telephone: [staffDetails?.telephone, [Validators.required]],
      userType: [staffDetails?.userType, [Validators.required]],
      info: [staffDetails?.info, []],
      examLists: [staffDetails?.examList, [Validators.required]],
      selectedWeekday: [this.weekdayEnum.ALL, []],
      practiceAvailabilityToggle: [!!staffDetails?.practiceAvailability?.length, []],
      practiceAvailability: this.fb.group({}),
    });

    if (staffDetails?.practiceAvailability?.length) {
      staffDetails.practiceAvailability.forEach((practice) => {
        this.addStaffForm.patchValue({ selectedWeekday: practice.weekday });
        this.addPracticeAvailabilityControls(practice);
      });
    }
  }

  private getPracticeAvailabilityFormGroup(weekday?: Weekday, dayStart?: TimeDistributed, dayEnd?: TimeDistributed): FormGroup {
    const fg = this.fb.group({
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

  private toggleTimeError(dayStart: AbstractControl | null, dayEnd: AbstractControl | null) {
    if (!dayStart && !dayEnd) {
      return;
    }

    if (
      dayStart?.value?.hour > dayEnd?.value?.hour ||
      (dayStart?.value?.hour === dayEnd?.value?.hour && dayStart?.value?.minute > dayEnd?.value?.minute)
    ) {
      dayStart?.setErrors({ startTimeErr: true });
      dayEnd?.setErrors({ endTimeErr: true });
    } else {
      if (dayStart?.hasError('startTimeErr')) {
        dayStart?.setErrors(null);
      }

      if (dayEnd?.hasError('endTimeErr')) {
        dayEnd?.setErrors(null);
      }
    }
  }

  private addPracticeAvailabilityControls(practice?: PracticeAvailability): void {
    const fg = this.addStaffForm.get('practiceAvailability') as FormGroup;
    const weekday = this.formValues.selectedWeekday;
    switch (weekday) {
      case Weekday.ALL:
        Object.values(this.weekdayEnum).forEach((day) => {
          if (typeof day === 'number' && day > 0) {
            const fa = fg.get(day.toString()) as FormArray;
            if (!fa || !fa.length) {
              fg.addControl(day.toString(), this.fb.array([this.getPracticeAvailabilityFormGroup(day)]));
            }
          }
        });
        break;
      default:
        if (!Object.keys(fg.value)?.length || (Object.keys(fg.value).length && !fg.get(this.formValues.selectedWeekday.toString()))) {
          fg.addControl(
            this.formValues.selectedWeekday.toString(),
            this.fb.array([
              this.getPracticeAvailabilityFormGroup(
                practice?.weekday,
                {
                  hour: practice?.dayStart?.getHours() ?? 0,
                  minute: practice?.dayStart?.getMinutes() ?? 0,
                },
                {
                  hour: practice?.dayEnd?.getHours() ?? 0,
                  minute: practice?.dayEnd?.getMinutes() ?? 0,
                },
              ),
            ]),
          );
        } else if (fg.get(this.formValues.selectedWeekday.toString()) && practice) {
          (fg.get(practice.weekday.toString()) as FormArray).push(
            this.getPracticeAvailabilityFormGroup(
              practice.weekday,
              {
                hour: practice.dayStart.getHours(),
                minute: practice.dayStart.getMinutes(),
              },
              {
                hour: practice.dayEnd.getHours(),
                minute: practice.dayEnd.getMinutes(),
              },
            ),
          );
        }
    }
  }

  public practiceAvailabilityWeekWiseControlsArray(all = false): FormArray[] {
    const controls: FormArray[] = [];

    const fg = this.addStaffForm.get('practiceAvailability');
    const { selectedWeekday } = this.formValues;
    let keys = Object.keys(this.formValues.practiceAvailability);
    if (!all) {
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

  public get formValues(): FormValues {
    return this.addStaffForm.value;
  }

  public getFormArrayName(controlArray: FormArray): Weekday {
    return controlArray.value[0].weekday;
  }

  public handleRadioButtonChange(toggle: boolean): void {
    //  set practice availability toggle
    this.addStaffForm.patchValue({ practiceAvailabilityToggle: toggle });
  }

  public selectWeekday(selectedWeekday: Weekday): void {
    if (this.formValues.selectedWeekday === selectedWeekday) {
      return;
    }

    // const { weekday } = this.formValues;
    this.addStaffForm.patchValue({ selectedWeekday });
    this.addPracticeAvailabilityControls();
  }

  public addSlot(controlArray: FormArray) {
    controlArray.push(this.getPracticeAvailabilityFormGroup(this.getFormArrayName(controlArray)));
  }

  public removeSlot(controlArray: FormArray, i: number) {
    controlArray.removeAt(i);
  }

  public saveStaff(): void {
    if (this.addStaffForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.addStaffForm.updateValueAndValidity();
      return;
    }

    const { practiceAvailabilityToggle, practiceAvailability, selectedWeekday, ...rest } = this.formValues;
    const addStaffReqData: AddStaffRequestData = {
      ...rest,
      practiceAvailability: [
        ...this.practiceAvailabilityWeekWiseControlsArray(true).reduce(
          (acc, formArray) => [
            ...acc,
            ...formArray.controls.reduce((a, control) => {
              if (control.value.dayStart && control.value.dayEnd) {
                return [
                  ...a,
                  {
                    ...control.value,
                    dayStart: new Date(new Date().setHours(control.value.dayStart.hour, control.value.dayStart.minute)),
                    dayEnd: new Date(new Date().setHours(control.value.dayEnd.hour, control.value.dayEnd.minute)),
                  },
                ];
              }
              return a;
            }, [] as PracticeAvailability[]),
          ],
          [] as PracticeAvailability[],
        ),
      ],
    };

    console.log(addStaffReqData.info);

    if (!addStaffReqData.info) {
      delete addStaffReqData.info;
    }
    if (!addStaffReqData.address) {
      delete addStaffReqData.address;
    }
    if (!addStaffReqData.practiceAvailability?.length) {
      delete addStaffReqData.practiceAvailability;
    }
    if (this.staffID) {
      addStaffReqData.id = this.staffID;
    }

    console.log(addStaffReqData);

    this.staffApiSvc
      .upsertStaff$(addStaffReqData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification(`Staff ${this.edit ? 'updated' : 'added'} successfully`);
        let route: string;
        if (this.comingFromRoute === 'view') {
          route = '../view';
        } else {
          route = this.edit ? '/staff' : '../';
        }

        console.log(route);
        this.router.navigate([route], { relativeTo: this.route });
      });
  }

  public getBadgeColor(weekday: Weekday): BadgeColor {
    if (this.formValues.selectedWeekday === weekday) {
      return 'primary';
    }

    if (weekday === Weekday.ALL) {
      for (let i = 1; i <= 7; i++) {
        if (!this.formValues.practiceAvailability[i.toString()]?.every((pa) => pa?.dayEnd && pa?.dayStart)) {
          return 'gray';
        }
      }

      return 'success';
    }

    const practiceHours = this.formValues.practiceAvailability[weekday.toString()];
    if (practiceHours?.length && practiceHours.every((pa) => pa.dayEnd && pa.dayStart)) {
      return 'success';
    }

    return 'gray';
  }
}
