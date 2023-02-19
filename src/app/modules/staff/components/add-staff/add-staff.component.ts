import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, distinctUntilChanged, filter, map, of, switchMap, takeUntil, tap } from 'rxjs';
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
import { COMING_FROM_ROUTE, EDIT, EMAIL_REGEX, STAFF_ID, TIME_24 } from '../../../../shared/utils/const';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { PracticeAvailability } from '../../../../shared/models/practice.model';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { Status } from '../../../../shared/models/status.model';
import { toggleControlError } from '../../../../shared/utils/toggleControlError';
import { checkTimeRangeOverlapping, formatTime, get24HourTimeString, timeToNumber } from '../../../../shared/utils/time';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { getNumberArray } from '../../../../shared/utils/getNumberArray';

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
      dayStart: string;
      dayEnd: string;
      startTimings: NameValue[];
      endTimings: NameValue[];
    }[];
  };
  examList: number[];
  selectedWeekday: Weekday;
  info: string;
}

@Component({
  selector: 'dfm-add-staff',
  templateUrl: './add-staff.component.html',
  styleUrls: ['./add-staff.component.scss'],
})
export class AddStaffComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public addStaffForm!: FormGroup;

  public exams$$ = new BehaviorSubject<any[]>([]);

  public staffTypes$$ = new BehaviorSubject<NameValue[]>([]);

  public staffDetails$$ = new BehaviorSubject<User | undefined>(undefined);

  public loading$$ = new BehaviorSubject<boolean>(false);

  public submitting$$ = new BehaviorSubject<boolean>(false);

  public weekdayEnum = Weekday;

  public comingFromRoute = '';

  public staffID!: number;

  public edit = false;

  public timings: NameValue[] = [];

  public filteredTimings: NameValue[] = [];

  public readonly interval: number = 5;

  public readonly invalidTimeError: string = 'invalidTime';

  public readonly invalidSlotRangeError: string = 'invalidSlot';

  public readonly slotExistsError: string = 'slotExists';

  constructor(
    private fb: FormBuilder,
    private userApiSvc: UserApiService,
    private examApiSvc: ExamApiService,
    private staffApiSvc: StaffApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private routerStateSvc: RouterStateService,
    private nameValuePipe: NameValuePairPipe,
    private timeInIntervalPipe: TimeInIntervalPipe,
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
        switchMap((staffID) => {
          if (staffID) {
            return this.staffApiSvc.getStaffByID(+staffID);
          }
          return of({} as User);
        }),
      )
      .subscribe((staffDetails) => {
        this.createForm(staffDetails);
        this.loading$$.next(false);
        this.staffDetails$$.next(staffDetails);
      });

    this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(this.interval))];
    this.filteredTimings = [...this.timings];

    this.staffApiSvc.staffTypes$
      .pipe(
        map((staffTypes) => staffTypes.map((staffType) => ({ name: staffType, value: staffType }))),
        takeUntil(this.destroy$$),
      )
      .subscribe((staffTypes) => this.staffTypes$$.next(staffTypes));

    this.examApiSvc.exams$
      .pipe(
        map((exams) => exams.filter((exam) => !!exam.status).map(({ name, id }) => ({ name, value: id }))),
        takeUntil(this.destroy$$),
      )
      .subscribe((exams) => {
        console.log('exams: ', exams);
        this.exams$$.next(exams);
      });

    this.addStaffForm
      ?.get('practiceAvailabilityToggle')
      ?.valueChanges.pipe(
        filter((value: boolean) => value),
        distinctUntilChanged(),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => this.addPracticeAvailabilityControls());
  }

  public override ngOnDestroy() {
    localStorage.removeItem(COMING_FROM_ROUTE);
    localStorage.removeItem(EDIT);
    localStorage.removeItem(STAFF_ID);
    super.ngOnDestroy();
  }

  private createForm(staffDetails?: User | undefined): void {
    this.addStaffForm = this.fb.group({
      firstname: [staffDetails?.firstname, [Validators.required]],
      lastname: [staffDetails?.lastname, [Validators.required]],
      email: [staffDetails?.email, [Validators.required]],
      telephone: [staffDetails?.telephone, []],
      userType: [staffDetails?.userType, [Validators.required]],
      info: [staffDetails?.info, []],
      examList: [staffDetails?.examList, []],
      status: [staffDetails?.status ?? Status.Active, []],
      selectedWeekday: [this.weekdayEnum.ALL, []],
      availabilityType: [!!staffDetails?.availabilityType, []],
      practiceAvailabilityToggle: [!!staffDetails?.practiceAvailability?.length, []],
      practiceAvailability: this.fb.group({}),
    });

    if (staffDetails?.practiceAvailability?.length) {
      const weekdays = new Set([0, 1, 2, 3, 4, 5, 6]);

      staffDetails.practiceAvailability.forEach((practice) => {
        this.addStaffForm.patchValue({ selectedWeekday: practice.weekday });
        this.addPracticeAvailabilityControls(practice);
        if (weekdays.has(practice.weekday)) {
          weekdays.delete(practice.weekday);
        }
      });

      weekdays.forEach((weekday) => {
        this.addStaffForm.patchValue({ selectedWeekday: weekday });
        this.addPracticeAvailabilityControls();
      });

      this.addStaffForm.patchValue({ selectedWeekday: Weekday.ALL });
    } else {
      this.addPracticeAvailabilityControls();
    }
  }

  private getPracticeAvailabilityFormGroup(weekday?: Weekday, dayStart?: string, dayEnd?: string): FormGroup {
    const fg = this.fb.group({
      weekday: [weekday ?? this.formValues.selectedWeekday, []],
      dayStart: [get24HourTimeString(dayStart), []],
      dayEnd: [get24HourTimeString(dayEnd), []],
      startTimings: [this.filteredTimings, []],
      endTimings: [this.filteredTimings, []],
    });

    fg.get('dayStart')
      ?.valueChanges.pipe(
        filter((time) => !!time),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => this.handleError(value as string, fg.get('dayStart')));

    fg.get('dayEnd')
      ?.valueChanges.pipe(
        filter((time) => !!time),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => this.handleError(value as string, fg.get('dayEnd')));

    return fg;
  }

  private addPracticeAvailabilityControls(practice?: PracticeAvailability): void {
    const fg = this.addStaffForm.get('practiceAvailability') as FormGroup;
    const weekday = this.formValues.selectedWeekday;

    if (weekday === Weekday.ALL) {
      getNumberArray(6).forEach((day) => {
        const fa = fg.get(day.toString()) as FormArray;
        if (!fa || !fa.length) {
          fg.addControl(day.toString(), this.fb.array([this.getPracticeAvailabilityFormGroup(day)]));
        }
      });

      const fa = fg.get('0') as FormArray;
      if (!fa || !fa.length) {
        fg.addControl('0'.toString(), this.fb.array([this.getPracticeAvailabilityFormGroup(0)]));
      }
    } else {
      const keys = Object.keys(fg.value);

      if (!keys?.length || (keys.length && !fg.get(this.formValues.selectedWeekday.toString()))) {
        fg.addControl(
          this.formValues.selectedWeekday.toString(),
          this.fb.array([this.getPracticeAvailabilityFormGroup(practice?.weekday, practice?.dayStart, practice?.dayEnd)]),
        );
      } else if (fg.get(this.formValues.selectedWeekday.toString()) && practice) {
        (fg.get(practice.weekday.toString()) as FormArray).push(
          this.getPracticeAvailabilityFormGroup(practice?.weekday, practice?.dayStart, practice?.dayEnd),
        );
      }
    }
  }

  public practiceAvailabilityWeekWiseControlsArray(all = false, column: 1 | 2 | 0 = 0): FormArray[] {
    const controls: FormArray[] = [];

    const fg = this.addStaffForm.get('practiceAvailability');
    const { selectedWeekday } = this.formValues;
    let keys = [1, 2, 3, 4, 5, 6, 0];

    if (!all) {
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
    console.log(this.formValues);

    if (this.addStaffForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.addStaffForm.markAsTouched();
      return;
    }

    const controlArrays: FormArray[] = this.practiceAvailabilityWeekWiseControlsArray(true);

    if (this.isFormInvalid(controlArrays)) {
      this.notificationSvc.showNotification('Form is not valid.', NotificationType.WARNING);
      return;
    }

    this.submitting$$.next(true);

    const { practiceAvailabilityToggle, practiceAvailability, selectedWeekday, ...rest } = this.formValues;
    const addStaffReqData: AddStaffRequestData = {
      ...rest,
      availabilityType: +!!practiceAvailabilityToggle,
      practiceAvailability: [
        ...this.practiceAvailabilityWeekWiseControlsArray(true).reduce(
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
    if (this.edit) {
      this.staffApiSvc
        .updateStaff(addStaffReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(() => {
          this.notificationSvc.showNotification(`Staff updated successfully`);
          let route: string;
          if (this.comingFromRoute === 'view') {
            route = '../view';
          } else {
            route = this.edit ? '/staff' : '../';
          }

          console.log(route);
          this.router.navigate([route], { relativeTo: this.route });
        });
    } else {
      this.staffApiSvc
        .addNewStaff$(addStaffReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(() => {
          this.notificationSvc.showNotification(`Staff updated successfully`);
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

  public getBadgeColor(weekday: Weekday): BadgeColor {
    if (this.formValues.selectedWeekday === weekday) {
      return 'secondary';
    }

    if (weekday === Weekday.ALL) {
      for (let i = 0; i < 7; i++) {
        if (!this.formValues.practiceAvailability[i.toString()]?.every((pa) => pa?.dayEnd && pa?.dayStart)) {
          return 'primary';
        }
      }

      return 'gray';
    }

    const practiceHours = this.formValues.practiceAvailability[weekday.toString()];
    if (practiceHours?.length && practiceHours.every((pa) => pa.dayEnd && pa.dayStart)) {
      return 'gray';
    }

    return 'primary';
  }

  public handleTimeInput(time: string, control: AbstractControl | null | undefined, timingValueControl: AbstractControl | null | undefined) {
    this.formatTime(time, control, timingValueControl);
    this.searchTime(time, timingValueControl);
  }

  public handleTimeFocusOut(time: string, control: AbstractControl | null | undefined) {
    console.log('in');
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

    const controlArrays = this.practiceAvailabilityWeekWiseControlsArray(true);

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

  private formatTime(time: string, control: AbstractControl | null | undefined, timingValueControl: AbstractControl | null | undefined) {
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

  public handleEmailInput(e: Event): void {
    const inputText = (e.target as HTMLInputElement).value;

    if (!inputText) {
      return;
    }

    if (!inputText.match(EMAIL_REGEX)) {
      this.addStaffForm.get('email')?.setErrors({
        email: true,
      });
    } else {
      this.addStaffForm.get('email')?.setErrors(null);
    }
  }
}
