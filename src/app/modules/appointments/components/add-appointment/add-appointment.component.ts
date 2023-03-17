import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BehaviorSubject, combineLatest, debounceTime, filter, map, switchMap, take, takeUntil, tap} from 'rxjs';
import {NotificationType} from 'diflexmo-angular-design';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {AppointmentApiService} from '../../../../core/services/appointment-api.service';
import {RoomType} from '../../../../shared/models/rooms.model';
import {NameValue} from '../../../../shared/components/search-modal.component';
import {RoomsApiService} from '../../../../core/services/rooms-api.service';
import {StaffApiService} from '../../../../core/services/staff-api.service';
import {ExamApiService} from '../../../../core/services/exam-api.service';
import {NameValuePairPipe} from '../../../../shared/pipes/name-value-pair.pipe';
import {TimeInIntervalPipe} from '../../../../shared/pipes/time-in-interval.pipe';
import {formatTime} from '../../../../shared/utils/time';
import {PhysicianApiService} from '../../../../core/services/physician.api.service';
import {UserType} from '../../../../shared/models/user.model';
import {
  AddAppointmentRequestData,
  Appointment,
  AppointmentSlotsRequestData, CreateAppointmentFormValues, SelectedSlots,
  Slot, SlotModified
} from '../../../../shared/models/appointment.model';
import {APPOINTMENT_ID, COMING_FROM_ROUTE, EDIT, EMAIL_REGEX, ENG_BE} from '../../../../shared/utils/const';
import {RouterStateService} from '../../../../core/services/router-state.service';
import {AppointmentStatus} from '../../../../shared/models/status.model';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {AppointmentUtils} from "../../../../shared/utils/appointment.utils";
import {SiteManagementApiService} from "../../../../core/services/site-management-api.service";
import {CalendarUtils} from "../../../../shared/utils/calendar.utils";
import {DateDistributed} from "../../../../shared/models/calendar.model";
import {GeneralUtils} from "../../../../shared/utils/general.utils";

@Component({
  selector: 'dfm-add-appointment',
  templateUrl: './add-appointment.component.html',
  styleUrls: ['./add-appointment.component.scss'],
})
export class AddAppointmentComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public appointmentForm!: FormGroup;

  public appointment$$ = new BehaviorSubject<Appointment | undefined>(undefined);

  public loading$$ = new BehaviorSubject(false);

  public loadingSlots$$ = new BehaviorSubject<boolean>(false);

  public submitting$$ = new BehaviorSubject(false);

  public filteredUserList: NameValue[] = [];

  private userList: NameValue[] = [];

  public filteredExamList: NameValue[] = [];

  private examList: NameValue[] = []

  public filteredPhysicianList: NameValue[] = [];

  private physicianList: NameValue[] = [];

  public roomType = RoomType;

  public edit = false;

  public comingFromRoute = '';

  examsData = [
    {
      name: 'Aanpasing steunzolen',
      value: 1,
    },
    {
      name: 'Levering steunzolen',
      value: 2,
    },
    {
      name: 'Maatname',
      value: 3,
    },
  ];

  public examIdToDetails: { [key: number]: { name: string; expensive: number } } = {};

  public slots: SlotModified[] = [];

  public selectedTimeSlot: SelectedSlots = {};

  public examIdToAppointmentSlots: { [key: number]: SlotModified[] } = {};

  public isSlotUpdated = false;

  public slots$$ = new BehaviorSubject<any>(null);

  public isCombinable: boolean = false;

  constructor(
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private appointmentApiSvc: AppointmentApiService,
    private roomApiSvc: RoomsApiService,
    private staffApiSvc: StaffApiService,
    private examApiService: ExamApiService,
    private physicianApiSvc: PhysicianApiService,
    private nameValuePipe: NameValuePairPipe,
    private timeInIntervalPipe: TimeInIntervalPipe,
    private datePipe: DatePipe,
    private routerStateSvc: RouterStateService,
    private router: Router,
    private route: ActivatedRoute,
    private shareDataService: ShareDataService,
    private siteManagementApiSvc: SiteManagementApiService,
    private cdr: ChangeDetectorRef
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
    this.createForm();

    this.siteManagementApiSvc.siteManagementData$.pipe(take(1)).subscribe((siteSettings) => {
      this.isCombinable = siteSettings.isSlotsCombinable;
    });

    this.examApiService.allExams$.pipe(takeUntil(this.destroy$$)).subscribe((exams) => {
      const keyValueExams = this.nameValuePipe.transform(exams, 'name', 'id');
      this.filteredExamList = [...keyValueExams];
      this.examList = [...keyValueExams];

      exams.forEach((exam) => {
        if (!this.examIdToDetails[+exam.id]) {
          this.examIdToDetails[+exam.id] = {
            name: exam.name,
            expensive: exam.expensive,
          };
        }
      });
    });

    this.staffApiSvc
      .getUsersByType(UserType.General)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((staffs) => {
        const keyValueExams = this.nameValuePipe.transform(staffs, 'fullName', 'id');
        this.filteredUserList = [...keyValueExams];
        this.userList = [...keyValueExams];
      });

    this.physicianApiSvc.physicians$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((physicians) => {
        const keyValuePhysicians = this.nameValuePipe.transform(physicians, 'fullName', 'id');
        this.filteredPhysicianList = [...keyValuePhysicians];
        this.physicianList = [...keyValuePhysicians];
      });

    this.routerStateSvc
      .listenForParamChange$(APPOINTMENT_ID)
      .pipe(
        filter((appointmentID: string) => {
          if (!appointmentID) {
            this.appointment$$.next({} as Appointment);
          }
          return !!appointmentID;
        }),
        switchMap((appointmentID) => {
          return this.appointmentApiSvc.getAppointmentByID$(+appointmentID);
        }),
        debounceTime(0),
        takeUntil(this.destroy$$),
      )
      .subscribe((appointment) => {
        this.appointment$$.next(appointment ?? ({} as Appointment));
        this.updateForm(appointment);
      });

    this.appointmentForm
      ?.get('startedAt')
      ?.valueChanges.pipe(
      debounceTime(0),
      filter((startedAt) => startedAt?.day && this.formValues.examList?.length),
      tap(() => this.loadingSlots$$.next(true)),
      map((date) => {
        this.clearSlotDetails();
        return AppointmentUtils.GenerateSlotRequestData(date, this.formValues.examList);
      }),
      switchMap((reqData) => this.appointmentApiSvc.getSlots$(reqData)),
      takeUntil(this.destroy$$)
    )
      .subscribe((slots) => {
        this.setSlots(slots[0].slots);
        this.loadingSlots$$.next(false);
      });

    this.appointmentForm
      .get('examList')
      ?.valueChanges.pipe(
      debounceTime(0),
      filter((examList) => examList?.length && this.formValues.startedAt?.day),
      tap(() => this.loadingSlots$$.next(true)),
      map((examList) => {
        this.clearSlotDetails();
        return AppointmentUtils.GenerateSlotRequestData(this.formValues.startedAt, examList);
      }),
      switchMap((reqData) => this.getSlotData(reqData)),
      takeUntil(this.destroy$$)
    )
      .subscribe((slots) => {
        this.setSlots(slots[0].slots);
        this.loadingSlots$$.next(false);
      });
  }

  public override ngOnDestroy() {
    localStorage.removeItem(COMING_FROM_ROUTE);
    localStorage.removeItem(EDIT);
    super.ngOnDestroy();
  }

  public get formValues(): CreateAppointmentFormValues {
    return this.appointmentForm?.value;
  }

  public getSlotData(reqData: AppointmentSlotsRequestData) {
    return this.appointmentApiSvc.getSlots$(reqData);
  }

  private createForm(): void {
    this.appointmentForm = this.fb.group({
      patientFname: ['', [Validators.required]],
      patientLname: ['', [Validators.required]],
      patientTel: [null, [Validators.required]],
      patientEmail: ['', []],
      doctorId: [null, []],
      startedAt: [null, [Validators.required]],
      startTime: [null, []],
      examList: [[], [Validators.required]],
      userId: [null, [Validators.required]],
      comments: ['', []],
      approval: [AppointmentStatus.Pending, []],
    });
  }

  private updateForm(appointment: Appointment | undefined) {

    let date!: Date;
    let dateDistributed: DateDistributed = {} as DateDistributed;

    if (appointment?.startedAt) {
      date = new Date(appointment.startedAt);
    } else if (appointment?.exams[0]?.startedAt) {
      date = new Date(appointment?.exams[0]?.startedAt);
    }

    dateDistributed = CalendarUtils.DateToDateDistributed(date);



    this.appointmentForm.patchValue(
      {
        patientFname: appointment?.patientFname ?? null,
        patientLname: appointment?.patientLname ?? null,
        patientTel: appointment?.patientTel ?? null,
        patientEmail: appointment?.patientEmail ?? null,
        doctorId: appointment?.doctorId?.toString() ?? null,
        startedAt: dateDistributed,
        examList: appointment?.exams?.map((exam) => exam.id?.toString()) ?? [],
        userId: appointment?.userId?.toString() ?? null,
        comments: appointment?.comments ?? null,
        approval: appointment?.approval ?? AppointmentStatus.Pending,
      },
      {emitEvent: false},
    );

    const examList = appointment?.exams?.map((exam) => exam.id) ?? [];

    this.loadingSlots$$.next(true);

    this.getSlotData(AppointmentUtils.GenerateSlotRequestData(dateDistributed, examList))
      .pipe(take(1))
      .subscribe((slots) => {
        this.setSlots(slots[0].slots);

        this.loadingSlots$$.next(false);

        const slotData = (start, end, examId, roomList, userList) =>
          ({
            start,
            end,
            roomList,
            userList,
            examId,
          } as SlotModified);

        if (appointment?.exams?.length) {
          const exams = this.isCombinable ? [appointment.exams[0]] : [...appointment.exams];

          exams.forEach((exam) => {
            const start = CalendarUtils.DateTo24TimeString(exam.startedAt);
            const end = CalendarUtils.DateTo24TimeString(exam.endedAt);
            this.handleSlotSelectionToggle(
              slotData(
                start,
                end,
                +exam.id,
                this.findSlot(+exam.id, start, end)?.roomList ?? [],
                this.findSlot(+exam.id, start, end)?.userList ?? [],
              ),
            );
          });
        }

        this.cdr.detectChanges();
      });
  }

  private findSlot(examID: number, start: string, end: string): SlotModified | undefined {
    if (this.examIdToAppointmentSlots[examID]?.length) {
      return this.examIdToAppointmentSlots[examID].find((slot) => slot.start === start && slot.end === end);
    }
  }

  private setSlots(slots: Slot[]) {
    const { examIdToSlots, newSlots } = AppointmentUtils.GetModifiedSlotData(slots);

    this.examIdToAppointmentSlots = examIdToSlots;
    this.slots = newSlots;

    // if (newSlots?.length) {
    //   const appointment = this.appointment$$.value;
    //   if (appointment && this.edit && !this.isSlotUpdated) {
    //     this.isSlotUpdated = true;
    //     this.toggleSlotSelection({
    //       examId: appointment?.exams[0]?.id,
    //       start: appointment?.startedAt?.toString().slice(-8),
    //       end: appointment?.endedAt?.toString().slice(-8),
    //       userList: newSlots.find((slot) => +slot.examId === +appointment?.exams[0]?.id)?.userList ?? [],
    //       roomList: newSlots.find((slot) => +slot.examId === +appointment?.exams[0]?.id)?.roomList ?? []
    //     });
    //   }
    // }
  }

  public saveAppointment(): void {


    try {
      if (this.appointmentForm.invalid) {
        this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
        Object.keys(this.appointmentForm.controls).forEach((key) => this.appointmentForm.get(key)?.markAsTouched());
        return;
      }

      if (
        (this.isCombinable && !Object.values(this.selectedTimeSlot).length) ||
        (!this.isCombinable && Object.values(this.selectedTimeSlot).length !== this.formValues.examList?.length)
      ) {
        this.notificationSvc.showNotification('Please select slots for all exams.', NotificationType.WARNING);
        return;
      }

      this.submitting$$.next(true);

      if (this.isCombinable) {
        this.formValues.examList.forEach((examID) => {
          const selectedSlot = Object.values(this.selectedTimeSlot)[0];

          if (!this.selectedTimeSlot[+examID]) {
            this.selectedTimeSlot[+examID] = {
              ...selectedSlot,
              examId: +examID,
            };
          }
        });
      }

      const requestData: AddAppointmentRequestData = AppointmentUtils.GenerateAppointmentRequestData(
        { ...this.formValues },
        { ...this.selectedTimeSlot },
        { ...(this.appointment$$.value ?? ({} as Appointment)) },
      );

      if (this.edit) {
        this.appointmentApiSvc
          .updateAppointment$(requestData)
          .pipe(takeUntil(this.destroy$$))
          .subscribe({
            next: () => {
              this.shareDataService.getLanguage$().subscribe((language: string) => {
                this.notificationSvc.showNotification(language === ENG_BE ? `Appointment updated successfully` : 'Afspraak succesvol geupdated');
              });
              this.submitting$$.next(false);

              let route: string;

              if (this.comingFromRoute === 'view') {
                route = '../view';
              } else {
                route = this.edit ? '/appointment' : '/dashboard';
              }
              this.router.navigate([route], { relativeTo: this.route });
            },
            error: (err) => {
              this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
              this.submitting$$.next(false);
            },
          });
      } else {
        this.appointmentApiSvc
          .saveAppointment$(requestData)
          .pipe(takeUntil(this.destroy$$))
          .subscribe({
            next: () => {
              this.shareDataService.getLanguage$().subscribe((language: string) => {
                this.notificationSvc.showNotification(language === ENG_BE ? `Appointment saved successfully` : 'Appointment saved successfully');
              });
              this.submitting$$.next(false);

              let route: string;
              switch (this.comingFromRoute) {
                case 'view':
                  route = '../view';
                  break;
                case 'dashboard':
                  route = '/';
                  break;
                default:
                  route = this.edit ? '/appointment' : '../';
              }
              this.router.navigate([route], { relativeTo: this.route });
            },
            error: (err) => {
              this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
              this.submitting$$.next(false);
            },
          });
      }
    } catch (e) {
      this.notificationSvc.showNotification('Failed to save the appointment', NotificationType.DANGER);
      this.submitting$$.next(false);
      return;
    }
  }

  public checkSlotAvailability(slot: SlotModified) {
    return AppointmentUtils.IsSlotAvailable(slot, this.selectedTimeSlot);
  }

  public handleSlotSelectionToggle(slot: SlotModified) {
    AppointmentUtils.ToggleSlotSelection(slot, this.selectedTimeSlot);
  }

  public handleEmailInput(e: Event): void {
    const inputText = (e.target as HTMLInputElement).value;

    if (!inputText) {
      return;
    }

    if (!inputText.match(EMAIL_REGEX)) {
      this.appointmentForm.get('patientEmail')?.setErrors({
        email: true,
      });
    } else {
      this.appointmentForm.get('patientEmail')?.setErrors(null);
    }
  }

  public clearSlotDetails() {
    this.examIdToAppointmentSlots = {};
    this.selectedTimeSlot = {};
    this.slots = [];
  }

  public handleDropdownSearch(searchText: string, type: 'user' | 'doctor' | 'exam'): void {
    switch (type) {
      case 'doctor':
        this.filteredPhysicianList = [...GeneralUtils.FilterArray(this.physicianList, searchText, 'name')];
        break;
      case 'user':
        this.filteredUserList = [...GeneralUtils.FilterArray(this.userList, searchText, 'name')];
        break;
      case 'exam':
        this.filteredExamList = [...GeneralUtils.FilterArray(this.examList, searchText, 'name')];
        break;
    }
  }
}
