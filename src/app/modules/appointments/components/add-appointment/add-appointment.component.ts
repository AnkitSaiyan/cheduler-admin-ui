import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import { DatePipe } from '@angular/common';
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

  public userList: NameValue[] = [];

  public examList: NameValue[] = [];

  public physicianList: NameValue[] = [];

  public timings: NameValue[];

  public roomType = RoomType;

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
  ) {
    super();
    this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(30))];
  }

  public ngOnInit(): void {
    this.appointmentApiSvc.appointment$.pipe(takeUntil(this.destroy$$)).subscribe((appointment) => {
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
      .subscribe((staffs) => (this.userList = this.nameValuePipe.transform(staffs, 'firstname', 'id')));

    this.physicianApiSvc.physicians$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((physicians) => (this.physicianList = this.nameValuePipe.transform(physicians, 'firstname', 'id')));
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get formValues(): FormValues {
    return this.appointmentForm.value;
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
      patientEmail: [appointment?.patientEmail ?? '', []],
      doctorId: [appointment?.doctorId ?? null, [Validators.required]],
      startedAt: [
        appointment?.startedAt
          ? {
              year: new Date(appointment.startedAt).getFullYear(),
              month: new Date(appointment.startedAt).getMonth() + 1,
              day: new Date(appointment.startedAt).getDate(),
            }
          : null,
        [Validators.required],
      ],
      startTime: [time, [Validators.required]],
      roomType: [appointment?.roomType ?? null, [Validators.required]],
      examList: [appointment?.examList ?? [], [Validators.required]],
      userId: [appointment?.userId ?? null, [Validators.required]],
      comments: [appointment?.comments ?? '', []],
    });
  }

  public saveAppointment(): void {
    console.log(this.formValues);
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

    this.appointmentApiSvc
      .upsertAppointment$(requestData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification(`Appointment ${this.appointment$$.value?.id ? 'updated' : 'saved'} successfully`);
      });
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
