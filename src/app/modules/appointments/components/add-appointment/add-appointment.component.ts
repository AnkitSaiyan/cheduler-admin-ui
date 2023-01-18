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

interface FormValues {
  firstname: string;
  lastname: string;
  email: string;
  telephone: number;
  doctor: number;
  date: any;
  time: string;
  roomType: RoomType;
  roomList: number[];
  examList: number[];
  userList: number[];
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

  public roomList: any = { private: [], public: [] };

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

    this.roomApiSvc.roomsGroupedByType$.pipe(takeUntil(this.destroy$$)).subscribe((rooms) => {
      this.roomList.public = [...this.nameValuePipe.transform(rooms.public, 'name', 'id')];
      this.roomList.private = [...this.nameValuePipe.transform(rooms.private, 'name', 'id')];
    });

    this.examApiService.exams$.pipe(takeUntil(this.destroy$$)).subscribe((exams) => {
      this.examList = this.nameValuePipe.transform(exams, 'name', 'id');
      console.log(this.examList);
    });

    this.staffApiSvc.staffList$
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

  private createForm(appointment?: any | undefined): void {
    let time;
    if (appointment?.date) {
      const date = new Date(appointment.date);
      time = this.datePipe.transform(date, 'hh:mmaa');
      if (time) {
        this.timings.push({ name: time, value: time });
      }
    }

    this.appointmentForm = this.fb.group({
      firstname: [appointment?.firstname ?? '', [Validators.required]],
      lastname: [appointment?.lastname ?? '', [Validators.required]],
      telephone: [appointment?.telephone, [Validators.required]],
      email: [appointment?.email ?? '', []],
      doctor: [appointment.doctor ?? null, [Validators.required]],
      date: [
        appointment?.date
          ? {
              year: new Date(appointment.date).getFullYear(),
              month: new Date(appointment.date).getMonth() + 1,
              day: new Date(appointment.date).getDate(),
            }
          : null,
        [Validators.required],
      ],
      time: [time, [Validators.required]],
      roomType: [appointment?.roomType ?? null, [Validators.required]],
      roomList: [appointment?.roomList ?? [], [Validators.required]],
      examList: [appointment?.examList ?? [], [Validators.required]],
      userList: [appointment?.userList ?? [], [Validators.required]],
      comments: [appointment?.comments ?? [], []],
    });
  }

  public saveAppointment(): void {
    console.log(this.formValues);
    if (this.appointmentForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.appointmentForm.updateValueAndValidity();
      return;
    }

    const { date, time, ...rest } = this.formValues;

    const requestData: any = {
      ...rest,
      date: new Date(date.year, date.month, date.day, +time.slice(0, 2), +time.slice(3, 5)).toISOString(),
    };

    if (this.appointment$$.value && this.appointment$$.value?.id) {
      requestData.id = this.appointment$$.value.id;
    }

    console.log(requestData);

    this.appointmentApiSvc
      .upsertAppointment$(requestData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification(`${this.appointment$$.value?.id ? 'Changes updated' : 'Saved'} successfully`);
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
      time: formattedTime,
    });
  }
}
