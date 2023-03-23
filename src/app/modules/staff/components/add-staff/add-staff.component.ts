import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, debounceTime, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import { ActivatedRoute, Router } from '@angular/router';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { AvailabilityType, User, UserType } from '../../../../shared/models/user.model';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { TimeSlot, Weekday } from '../../../../shared/models/calendar.model';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { AddStaffRequestData } from '../../../../shared/models/staff.model';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { COMING_FROM_ROUTE, DUTCH_BE, EDIT, EMAIL_REGEX, ENG_BE, STAFF_ID, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { PracticeAvailabilityServer } from '../../../../shared/models/practice.model';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { Status } from '../../../../shared/models/status.model';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { Translate } from '../../../../shared/models/translate.model';

interface FormValues {
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  address: string;
  userType: UserType;
  practiceAvailabilityToggle?: boolean;
  examList: number[];
  info: string;
}

@Component({
  selector: 'dfm-add-staff',
  templateUrl: './add-staff.component.html',
  styleUrls: ['./add-staff.component.scss'],
})
export class AddStaffComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public addStaffForm!: FormGroup;

  public exams$$ = new BehaviorSubject<NameValue[] | null>(null);

  public staffTypes$$ = new BehaviorSubject<NameValue[]>([]);

  public staffDetails$$ = new BehaviorSubject<User | undefined>(undefined);

  public loading$$ = new BehaviorSubject<boolean>(false);

  public submitting$$ = new BehaviorSubject<boolean>(false);

  public staffAvailabilityData$$ = new BehaviorSubject<PracticeAvailabilityServer[]>([]);

  public emitEvents$$ = new Subject<void>();

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

  private selectedLang: string = ENG_BE;

  public statuses = Statuses;

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
    private cdr: ChangeDetectorRef,
    private shareDataSvc: ShareDataService,
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
    this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(this.interval))];
    this.filteredTimings = [...this.timings];

    this.createForm();

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
        debounceTime(0),
      )
      .subscribe((staffDetails) => {
        if (staffDetails) {
          this.updateForm(staffDetails);

          if (staffDetails?.practiceAvailability?.length) {
            this.staffAvailabilityData$$.next(staffDetails.practiceAvailability);
          }
        }

        this.loading$$.next(false);
        this.staffDetails$$.next(staffDetails);
      });

    this.staffApiSvc.staffTypes$.pipe(takeUntil(this.destroy$$)).subscribe((staffTypes) => this.staffTypes$$.next(staffTypes));

    this.examApiSvc.exams$
      .pipe(
        map((exams) => exams.filter((exam) => !!exam.status).map(({ name, id }) => ({ name, value: id.toString() }))),
        takeUntil(this.destroy$$),
      )
      .subscribe((exams) => {
        this.exams$$.next(exams);
      });

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
        switch (lang) {
          case ENG_BE:
            this.statuses = Statuses;
            break;
          case DUTCH_BE:
            this.statuses = StatusesNL;
            break;
        }
      });
  }

  public override ngOnDestroy() {
    localStorage.removeItem(COMING_FROM_ROUTE);
    localStorage.removeItem(EDIT);
    localStorage.removeItem(STAFF_ID);
    super.ngOnDestroy();
  }

  private createForm() {
    this.addStaffForm = this.fb.group({
      firstname: [null, [Validators.required]],
      lastname: [null, [Validators.required]],
      email: [null, [Validators.required]],
      telephone: [null, []],
      userType: [null, [Validators.required]],
      info: [null, []],
      // examList: [null, []],
      status: [null ?? Status.Active, []],
      availabilityType: [AvailabilityType.Unavailable, []],
      practiceAvailabilityToggle: [false, []],
    });
  }

  private updateForm(staffDetails?: User): void {
    this.addStaffForm.patchValue({
      firstname: staffDetails?.firstname,
      lastname: staffDetails?.lastname,
      email: staffDetails?.email,
      telephone: staffDetails?.telephone,
      info: staffDetails?.info,
      // examList: [staffDetails?.exams?.map((exam) => exam?.id?.toString()), []],
      status: staffDetails?.status ?? Status.Active,
      availabilityType: !!staffDetails?.availabilityType,
      practiceAvailabilityToggle: !!staffDetails?.practiceAvailability?.length,
    });

    setTimeout(() => {
      this.addStaffForm.get('userType')?.setValue(staffDetails?.userType);
      this.addStaffForm.get('userType')?.markAsUntouched();
    }, 0);
  }

  public get formValues(): FormValues {
    return this.addStaffForm.value;
  }

  public handleRadioButtonChange(toggle: boolean): void {
    //  set practice availability toggle
    this.addStaffForm.patchValue({ practiceAvailabilityToggle: toggle }, { emitEvent: false });
  }

  public saveStaff(): void {
    if (!this.formValues.practiceAvailabilityToggle) {
      this.saveForm();
      return;
    }

    this.emitEvents$$.next();
    // const requiredKeys: string[] = ['firstname', 'lastname', 'email', 'userType'];
    // let valid = true;
    //
    // requiredKeys.forEach((key) => {
    //   if (this.addStaffForm.get(key)?.invalid) {
    //     this.addStaffForm.get(key)?.markAsTouched();
    //     if (valid) {
    //       valid = false;
    //     }
    //   }
    // });
    //
    // const controlArrays: FormArray[] = this.practiceAvailabilityWeekWiseControlsArray(true);
    //
    // if (valid) {
    //   valid = !this.isPracticeFormInvalid(controlArrays);
    // }
    //
    // if (!valid) {
    //   this.notificationSvc.showNotification(Translate.FormInvalidSimple[this.selectedLang], NotificationType.WARNING);
    //   return;
    // }
    //
    // this.submitting$$.next(true);
    //
    // const { practiceAvailabilityToggle, practiceAvailability, selectedWeekday, ...rest } = this.formValues;
    // const addStaffReqData: AddStaffRequestData = {
    //   ...rest,
    //   availabilityType: +!!practiceAvailabilityToggle,
    //   practiceAvailability: practiceAvailabilityToggle
    //     ? [
    //         ...this.practiceAvailabilityWeekWiseControlsArray(true).reduce(
    //           (acc, formArray) => [
    //             ...acc,
    //             ...formArray.controls.reduce((a, control) => {
    //               if (control.value.dayStart && control.value.dayEnd) {
    //                 return [
    //                   ...a,
    //                   {
    //                     weekday: control.value.weekday,
    //                     dayStart: control.value.dayStart,
    //                     dayEnd: control.value.dayEnd,
    //                   },
    //                 ];
    //               }
    //               return a;
    //             }, [] as PracticeAvailability[]),
    //           ],
    //           [] as PracticeAvailability[],
    //         ),
    //       ]
    //     : [],
    // };
    //
    // if (!addStaffReqData.info) {
    //   delete addStaffReqData.info;
    // }
    //
    // if (!addStaffReqData.address) {
    //   delete addStaffReqData.address;
    // }
    //
    // if (!addStaffReqData.practiceAvailability?.length) {
    //   addStaffReqData.availabilityType = AvailabilityType.Unavailable;
    // }
    //
    // addStaffReqData.id = Number.isNaN(+this.staffID) ? 0 : +this.staffID;
    //
    // this.staffApiSvc
    //   .addNewStaff$(addStaffReqData)
    //   .pipe(takeUntil(this.destroy$$))
    //   .subscribe(() => {
    //     if (this.staffID) {
    //       this.notificationSvc.showNotification(Translate.SuccessMessage.StaffUpdated[this.selectedLang]);
    //     } else {
    //       this.notificationSvc.showNotification(Translate.SuccessMessage.StaffAdded[this.selectedLang]);
    //     }
    //     let route: string;
    //     if (this.comingFromRoute === 'view') {
    //       route = '../view';
    //     } else {
    //       route = this.edit ? '/staff' : '../';
    //     }
    //
    //     this.router.navigate([route], { relativeTo: this.route });
    //   });
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

  public saveForm(timeSlotFormValues?: { isValid: boolean; values: TimeSlot[] }) {
    if (this.addStaffForm.invalid) {
      this.addStaffForm.markAllAsTouched();
      this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
      return;
    }

    if (this.formValues.practiceAvailabilityToggle && timeSlotFormValues && !timeSlotFormValues.isValid) {
      this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
      return;
    }

    this.submitting$$.next(true);

    const { practiceAvailabilityToggle, ...rest } = this.formValues;
    const addStaffReqData: AddStaffRequestData = {
      ...rest,
      availabilityType: timeSlotFormValues ? +!!timeSlotFormValues.values?.length : 0,
      practiceAvailability: timeSlotFormValues ? timeSlotFormValues.values : [],
    };

    if (!addStaffReqData.info) {
      delete addStaffReqData.info;
    }

    if (!addStaffReqData.address) {
      delete addStaffReqData.address;
    }

    if (!addStaffReqData.practiceAvailability?.length) {
      addStaffReqData.availabilityType = AvailabilityType.Unavailable;
    }

    addStaffReqData.id = Number.isNaN(+this.staffID) ? 0 : +this.staffID;

    this.staffApiSvc
      .addNewStaff$(addStaffReqData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        if (this.staffID) {
          this.notificationSvc.showNotification(Translate.SuccessMessage.StaffUpdated[this.selectedLang]);
        } else {
          this.notificationSvc.showNotification(Translate.SuccessMessage.StaffAdded[this.selectedLang]);
        }
        let route: string;
        if (this.comingFromRoute === 'view') {
          route = '../view';
        } else {
          route = this.edit ? '/staff' : '../';
        }

        this.router.navigate([route], { relativeTo: this.route });
      });
  }
}
