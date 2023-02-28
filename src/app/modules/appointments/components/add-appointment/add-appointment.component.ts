import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, map, switchMap, takeUntil, tap } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { RoomType } from '../../../../shared/models/rooms.model';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { formatTime } from '../../../../shared/utils/time';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';
import { UserType } from '../../../../shared/models/user.model';
import { AddAppointmentRequestData, Appointment, AppointmentSlotsRequestData, Slot } from '../../../../shared/models/appointment.model';
import { APPOINTMENT_ID, COMING_FROM_ROUTE, EDIT, EMAIL_REGEX, ENG_BE } from '../../../../shared/utils/const';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { AppointmentStatus } from '../../../../shared/models/status.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';

interface FormValues {
  patientFname: string;
  patientLname: string;
  patientEmail: string;
  patientTel: number;
  startedAt: any;
  startTime: string;
  doctorId: number;
  userId: number;
  // roomType: RoomType;
  examList: number[];
  comments: string;
}

@Component({
  selector: 'dfm-add-appointment',
  templateUrl: './add-appointment.component.html',
  styleUrls: ['./add-appointment.component.scss'],
})
export class AddAppointmentComponent extends DestroyableComponent implements OnInit, AfterViewInit, OnDestroy {
  public appointmentForm!: FormGroup;

  public appointment$$ = new BehaviorSubject<Appointment | undefined>(undefined);

  public loading$$ = new BehaviorSubject(false);

  public loadingSlots$$ = new BehaviorSubject<boolean>(false);

  public submitting$$ = new BehaviorSubject(false);

  public userList: NameValue[] = [];

  public examList: NameValue[] = [];

  public physicianList: NameValue[] = [];

  public timings: NameValue[];

  public roomType = RoomType;

  public edit = false;

  public comingFromRoute = '';

  public timeSlots: string[] = ['10:30-10:45', '11:00-11:15', '11:30-11:45', '11:45-12:00'];

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

  public slots: Slot[] = [];

  public selectedTimeSlot: { [key: number]: string } = {};

  public examIdToAppointmentSlots: { [key: number]: Slot[] } = {};

  public isSlotUpdated = false;

  public slots$$ = new BehaviorSubject<any>(null);

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
    private shareDataService: ShareDataService
  ) {
    super();
    this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(30))];

    const state = this.router.getCurrentNavigation()?.extras?.state;
    if (state !== undefined) {
      this.loading$$.next(true);
      this.comingFromRoute = state[COMING_FROM_ROUTE];
      this.edit = state[EDIT];

      console.log('this.comingFromRoute: ', this.comingFromRoute);
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
      console.log('this.comingFromRoute: ', this.comingFromRoute);
    }
    const edit = localStorage.getItem(EDIT);
    if (edit) {
      this.edit = edit === 'true';
    }
  }

  public ngOnInit(): void {
    this.createForm();

    this.examApiService.exams$.pipe(takeUntil(this.destroy$$)).subscribe((exams) => {
      this.examList = this.nameValuePipe.transform(exams, 'name', 'id');
      exams.forEach((exam) => {
        if (!this.examIdToDetails[+exam.id]) {
          this.examIdToDetails[+exam.id] = {
            name: exam.name,
            expensive: exam.expensive,
          };
        }
      });

      // this.appointmentForm.patchValue({ examList: this.appointment$$.value?.examList?.map((examID) => examID?.toString()) });
    });

    this.staffApiSvc
      .getUsersByType(UserType.General)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((staffs) => {
        console.log(staffs);
        this.userList = this.nameValuePipe.transform(staffs, 'firstname', 'id');
        console.log(this.userList);
      });

    this.physicianApiSvc.physicians$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((physicians) => (this.physicianList = this.nameValuePipe.transform(physicians, 'firstname', 'id')));

    this.routerStateSvc
      .listenForParamChange$(APPOINTMENT_ID)
      .pipe(
        filter((appointmentID: string) => {
          console.log('appointmentID in filter: ', appointmentID);
          if (!appointmentID) {
            this.appointment$$.next({} as Appointment);
          }
          return !!appointmentID;
        }),
        switchMap((appointmentID) => {
          console.log('appointmentID: ', appointmentID);
          return this.appointmentApiSvc.getAppointmentByID$(+appointmentID);
        }),
        debounceTime(300),
        takeUntil(this.destroy$$),
      )
      .subscribe((appointment) => {
        console.log('appointment: ', appointment);
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
          this.examIdToAppointmentSlots = {};
          this.selectedTimeSlot = {};
          this.slots = [];
          return this.createSlotRequestData(date, this.formValues.examList);
        }),
        switchMap((reqData) => this.appointmentApiSvc.getSlots$(reqData)),
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
          this.examIdToAppointmentSlots = {};
          this.selectedTimeSlot = {};
          this.slots = [];
          return this.createSlotRequestData(this.formValues.startedAt, examList);
        }),
        switchMap((reqData) => this.appointmentApiSvc.getSlots$(reqData)),
      )
      .subscribe((slots) => {
        this.setSlots(slots[0].slots);
        this.loadingSlots$$.next(false);
      });
  }

  public ngAfterViewInit() {
    // this.updateForm(this.appointment$$.value);
  }

  public override ngOnDestroy() {
    localStorage.removeItem(COMING_FROM_ROUTE);
    localStorage.removeItem(EDIT);
    super.ngOnDestroy();
  }

  public get formValues(): FormValues {
    return this.appointmentForm?.value;
  }

  private createForm(): void {
    // console.log(appointment?.doctorId);
    this.appointmentForm = this.fb.group({
      patientFname: ['', [Validators.required]],
      patientLname: ['', [Validators.required]],
      patientTel: [null, [Validators.required]],
      patientEmail: ['', [Validators.required]],
      doctorId: [null, [Validators.required]],
      startedAt: [null, [Validators.required]],
      startTime: [null, []],
      examList: [[], [Validators.required]],
      userId: [null, [Validators.required]],
      comments: ['', []],
      approval: [AppointmentStatus.Pending, []],
    });
  }

  private updateForm(appointment: Appointment | undefined) {
    let time;
    let dateObj;

    if (appointment?.startedAt) {
      const date = new Date(appointment.startedAt);
      dateObj = this.getDateToObject(date);
      if (date) {
        time = this.datePipe.transform(date, 'hh:mmaa');
        if (time) {
          this.timings.push({ name: time, value: time });
        }
      }
    } else if (appointment?.exams[0]?.startedAt) {
      const date = new Date(appointment?.exams[0]?.startedAt);
      dateObj = this.getDateToObject(date);
      if (date) {
        time = this.datePipe.transform(date, 'hh:mmaa');
        if (time) {
          this.timings.push({ name: time, value: time });
        }
      }
    }

    this.appointmentForm.patchValue({
      patientFname: appointment?.patientFname ?? null,
      patientLname: appointment?.patientLname ?? null,
      patientTel: appointment?.patientTel ?? null,
      patientEmail: appointment?.patientEmail ?? null,
      doctorId: appointment?.doctorId?.toString() ?? null,
      startedAt: dateObj,
      examList: appointment?.exams?.map((exam) => exam.id?.toString()) ?? [],
      userId: appointment?.userId?.toString() ?? null,
      comments: appointment?.comments ?? null,
      approval: appointment?.approval ?? AppointmentStatus.Pending,
    });

    const examId = appointment?.exams[0]?.id;
    const timeSlot = `${appointment?.startedAt?.toString().slice(-8)}-${appointment?.endedAt?.toString().slice(-8)}`;

    if (examId) {
      this.selectedTimeSlot[+examId] = timeSlot;
      console.log(this.selectedTimeSlot);
    }
  }

  private createSlotRequestData(date: { day: number; month: number; year: number }, examList: number[]): AppointmentSlotsRequestData {
    const dateString = `${date.year}-${date.month}-${date.day}`;
    return {
      exams: examList,
      fromDate: dateString,
      toDate: dateString,
    } as AppointmentSlotsRequestData;
  }

  private setSlots(slots: Slot[]) {
    console.log(slots);
    this.slots = slots;
    if (slots?.length) {
      this.slots?.forEach((slot) => {
        if (!this.examIdToAppointmentSlots[slot.examId]) {
          this.examIdToAppointmentSlots[slot.examId] = [];
        }

        this.examIdToAppointmentSlots[slot.examId].push(slot);
      });

      const appointment = this.appointment$$.value;
      if (appointment && this.edit === true && this.isSlotUpdated === false) {
        this.isSlotUpdated = true;
        this.toggleSlotSelection({
          examId: appointment?.exams[0]?.id,
          start: appointment?.startedAt?.toString().slice(-8),
          end: appointment?.endedAt?.toString().slice(-8),
        });
      }
    }
  }

  public saveAppointment(): void {
    try {
      if (this.appointmentForm.invalid) {
        this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
        Object.keys(this.appointmentForm.controls).forEach((key) => this.appointmentForm.get(key)?.markAsTouched());
        return;
      }

      this.submitting$$.next(true);

      const { startedAt, startTime, examList, ...rest } = this.formValues;

      const requestData: AddAppointmentRequestData = {
        ...rest,
        examDetails: examList.map((examID) => {
          const examDetails = {
            examId: +examID,
            startedAt: `${startedAt.year}-${startedAt.month}-${startedAt.day}`,
            endedAt: `${startedAt.year}-${startedAt.month}-${startedAt.day}`,
          };

          if (this.selectedTimeSlot[+examID]) {
            const time = this.selectedTimeSlot[+examID].split('-');
            const start = time[0].split(':');
            const end = time[1].split(':');

            examDetails.startedAt += ` ${start[0]}:${start[1]}:00`;
            examDetails.endedAt += ` ${end[0]}:${end[1]}:00`;
          } else {
            examDetails.startedAt += ' 00:00:00';
            examDetails.endedAt += (() => {
              const { expensive } = this.examIdToDetails[+examID];

              let hour: string = '00';
              let minute: string = '00';

              if (+expensive >= 60) {
                hour = Math.floor(+expensive / 60).toString();
                minute = Math.floor(+expensive % 60).toString();
              }

              if (+expensive < 60 && +expensive > 0) {
                minute = +expensive < 10 ? `0${expensive}` : `${expensive}`;
              }

              return ` ${hour}:${minute}:00`;
            })();
          }

          return examDetails;
        }),
      };

      if (this.appointment$$.value && this.appointment$$.value?.id) {
        requestData.id = this.appointment$$.value.id;
      }

      console.log(requestData);

      if (this.edit) {
        this.appointmentApiSvc
          .updateAppointment$(requestData)
          .pipe(takeUntil(this.destroy$$))
          .subscribe({
            next: () => {
              this.shareDataService.getLanguage$().subscribe((language: string)=>{
                this.notificationSvc.showNotification(language === ENG_BE? `Appointment updated successfully`: 'Afspraak succesvol geupdated');
              })
              this.submitting$$.next(false);

              let route: string;
              console.log('this.comingFromRoute: ', this.comingFromRoute);
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
              this.shareDataService.getLanguage$().subscribe((language: string)=>{
                this.notificationSvc.showNotification(language === ENG_BE ? `Appointment saved successfully`: 'Appointment saved successfully');
              })
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
    }
  }

  public handleTimeInput(time: string) {
    const formattedTime = formatTime(time);

    console.log(formattedTime);

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

    this.appointmentForm.patchValue({
      startTime: formattedTime,
    });
  }

  public isSlotAvailable(slot: Slot) {
    let isAvailable = true;

    Object.entries(this.selectedTimeSlot).forEach(([key, value]) => {
      const timeString = `${slot.start}-${slot.end}`;
      if (+key !== +slot.examId && timeString === value) {
        isAvailable = false;
      }
    });

    return isAvailable;
  }

  public toggleSlotSelection(slot: Slot) {
    if (!this.isSlotAvailable(slot)) {
      return;
    }

    if (this.selectedTimeSlot[slot.examId] === `${slot.start}-${slot.end}`) {
      this.selectedTimeSlot[slot.examId] = '';
    } else {
      this.selectedTimeSlot[slot.examId] = `${slot.start}-${slot.end}`;
      console.log(this.selectedTimeSlot);
    }
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

  public getDateToObject(date: Date) {
    return {
      year: new Date(date).getFullYear(),
      month: new Date(date).getMonth() + 1,
      day: new Date(date).getDate(),
    };
  }

  // public selectSlot(slot, id) {
  //   const index = this.selectedTimeSlot.findIndex((timeSlot) => +timeSlot.id === +id);
  //   if (index !== -1) {
  //     this.selectedTimeSlot.splice(index, 1, { slot, examId: id });
  //   } else {
  //     this.selectedTimeSlot.push({ slot, examId: id });
  //   }
  //
  //   console.log(this.selectedTimeSlot);
  // }
  //
  // public isSlotSelected(slot: string, id: number): boolean {
  //   return false;
  //   return !!this.selectedTimeSlot.find((timeSlot) => timeSlot?.slot === slot && +timeSlot?.examId === +id);
  // }
}
