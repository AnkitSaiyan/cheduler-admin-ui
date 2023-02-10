import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, filter, from, switchMap, takeUntil, tap } from 'rxjs';
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
import { formatTime } from '../../../../shared/utils/formatTime';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';
import { UserType } from '../../../../shared/models/user.model';
import { AddAppointmentRequestData, Appointment } from '../../../../shared/models/appointment.model';
import { APPOINTMENT_ID, COMING_FROM_ROUTE, EDIT, STAFF_ID } from '../../../../shared/utils/const';
import { RouterStateService } from '../../../../core/services/router-state.service';

interface FormValues {
  patientFname: string;
  patientLname: string;
  patientEmail: string;
  patientTel: number;
  startedAt: any;
  startTime: string;
  doctorId: number;
  userId: number;
  roomType: RoomType;
  examList: number[];
  comments: string;
}

@Component({
  selector: 'dfm-add-appointment',
  templateUrl: './add-appointment.component.html',
  styleUrls: ['./add-appointment.component.scss'],
})
export class AddAppointmentComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public appointmentForm!: FormGroup;

  public appointment$$ = new BehaviorSubject<any>(undefined);

  public loading$$ = new BehaviorSubject(false);

  public userList: NameValue[] = [];

  public examList: NameValue[] = [];

  public physicianList: NameValue[] = [];

  public timings: NameValue[];

  public roomType = RoomType;

  public edit = false;

  public comingFromRoute = '';

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
    this.routerStateSvc
      .listenForParamChange$(APPOINTMENT_ID)
      .pipe(
        filter((appointmentID: string) => {
          console.log('appointmentID in filter: ', appointmentID);
          if (!appointmentID) {
            this.appointment$$.next({});
            this.createForm();
          }
          return !!appointmentID;
        }),
        switchMap((appointmentID) => {
          console.log('appointmentID: ', appointmentID);
          return this.appointmentApiSvc.getAppointmentByID(+appointmentID);
        }),
        takeUntil(this.destroy$$),
      )
      .subscribe((appointment) => {
        console.log('appointment: ', appointment);
        this.appointment$$.next(appointment ?? {});
        this.createForm(appointment);
      });

    this.examApiService.exams$.pipe(takeUntil(this.destroy$$)).subscribe((exams) => {
      this.examList = this.nameValuePipe.transform(exams, 'name', 'id');
      console.log(this.examList);
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
  }

  public override ngOnDestroy() {
    localStorage.removeItem(COMING_FROM_ROUTE);
    localStorage.removeItem(EDIT);
    super.ngOnDestroy();
  }

  public get formValues(): FormValues {
    return this.appointmentForm?.value;
  }

  private createForm(appointment?: Appointment | undefined | null): void {
    let time;
    if (appointment?.startedAt) {
      const date = new Date(appointment.startedAt);

      if (date) {
        time = this.datePipe.transform(date, 'hh:mmaa');
        if (time) {
          this.timings.push({ name: time, value: time });
        }
      }
    }

    this.appointmentForm = this.fb.group({
      patientFname: [appointment?.patientFname ?? '', [Validators.required]],
      patientLname: [appointment?.patientLname ?? '', [Validators.required]],
      patientTel: [appointment?.patientTel ?? null, [Validators.required]],
      patientEmail: [appointment?.patientEmail ?? '', [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      doctorId: [appointment?.doctorId?.toString() ?? null, [Validators.required]],
      startedAt: [
        appointment?.startedAt
          ? {
              year: new Date(appointment.startedAt).getFullYear(),
              month: new Date(appointment.startedAt).getMonth(),
              day: new Date(appointment.startedAt).getDate(),
            }
          : null,
        [Validators.required],
      ],
      startTime: [time, [Validators.required]],
      roomType: [appointment?.roomType ?? null, [Validators.required]],
      examList: [appointment?.examList?.map((examID) => examID?.toString()) ?? [], [Validators.required]],
      userId: [appointment?.userId?.toString() ?? null, ],
      comments: [appointment?.comments ?? '', []],
    });
  }

  public saveAppointment(): void {
    console.log(this.formValues);
    if (this.appointmentForm['controls']['patientEmail'].invalid) {
      this.notificationSvc.showNotification('Please enter valid email', NotificationType.WARNING);
      this.appointmentForm.updateValueAndValidity();
      return;
    }

    if (this.appointmentForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.appointmentForm.updateValueAndValidity();
      return;
    }

    const { startedAt, startTime, ...rest } = this.formValues;

    const requestData: AddAppointmentRequestData = {
      ...rest,
      startedAt: new Date(startedAt.year, startedAt.month, startedAt.day, +startTime.slice(0, 2), +startTime.slice(3, 5)),
    };

    if (this.appointment$$.value && this.appointment$$.value?.id) {
      requestData.id = this.appointment$$.value.id;
    }

    console.log(requestData);

    if (this.edit) {
      this.appointmentApiSvc.updateAppointment$(requestData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification(`Appointment updated successfully`);
        let route: string;
        console.log('this.comingFromRoute: ', this.comingFromRoute);
        if (this.comingFromRoute === 'view') {
          route = '../view';
        } else {
          route = this.edit ? '/appointment' : '/dashboard';
        }

        console.log(route);
        this.router.navigate([route], { relativeTo: this.route });
      });
    }else{
      this.appointmentApiSvc.saveAppointment$(requestData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(() => {
          this.notificationSvc.showNotification(`Appointment saved successfully`);
          let route: string;
          console.log('this.comingFromRoute: ', this.comingFromRoute);
          if (this.comingFromRoute === 'view') {
            route = '../view';
          } else {
            route = this.edit ? '/appointment' : '/dashboard';
          }
  
          console.log(route);
          this.router.navigate([route], { relativeTo: this.route });
        });
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
}
