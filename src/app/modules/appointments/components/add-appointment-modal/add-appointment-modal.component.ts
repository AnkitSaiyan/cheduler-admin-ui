import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { combineLatest, debounceTime, filter, map, switchMap, takeUntil, tap } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import { ModalService } from '../../../../core/services/modal.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ShareDataService } from '../../../../core/services/share-data.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { AddAppointmentRequestData, AppointmentSlotsRequestData, Slot } from '../../../../shared/models/appointment.model';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { UserType } from '../../../../shared/models/user.model';
import { NotificationDataService } from '../../../../core/services/notification-data.service';

interface FormValues {
  patientFname: string;
  patientLname: string;
  patientEmail: string;
  patientTel: number;
  startedAt: any;
  // startTime: string;
  doctorId: number;
  userId: number;
  // roomType: RoomType;
  examList: number[];
  comments: string;
}

@Component({
  selector: 'dfm-add-appointment-modal',
  templateUrl: './add-appointment-modal.component.html',
  styleUrls: ['./add-appointment-modal.component.scss'],
})
export class AddAppointmentModalComponent extends DestroyableComponent implements OnInit, OnDestroy {
  @HostListener('document:keyup.esc')
  private onKeyup() {
    if (this.modalData?.element) {
      this.modalData.element.remove();
    }
  }

  public appointmentForm!: FormGroup;

  public activeMenu = 2;

  public examList: NameValue[] = [];

  public physicianList: NameValue[] = [];

  public userList: NameValue[] = [];

  private modalData!: {
    event: MouseEvent;
    element: HTMLDivElement;
    elementContainer: HTMLDivElement;
    startedAt: Date;
  };

  public slots: Slot[] = [];

  public selectedTimeSlot: { [key: number]: string } = {};

  public examIdToAppointmentSlots: { [key: number]: Slot[] } = {};

  public selectedTime!: string;

  private pixelPerMinute = 4;

  constructor(
    private modalSvc: ModalService,
    private fb: FormBuilder,
    private shareDataSvc: ShareDataService,
    private examApiService: ExamApiService,
    private nameValuePipe: NameValuePairPipe,
    private appointmentApiSvc: AppointmentApiService,
    private physicianApiSvc: PhysicianApiService,
    private staffApiSvc: StaffApiService,
    private notificationSvc: NotificationDataService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.modalSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data) => {
      this.modalData = data;
      if (this.modalData.event.offsetY) {
        const minutes = Math.round(+this.modalData.event.offsetY / this.pixelPerMinute);
        const hour = `0${Math.floor(minutes / 60)}`.slice(-2);
        const min = `0${minutes % 60}`.slice(-2);
        console.log(minutes % 60);
        this.selectedTime = `${hour}:${min}:00`;
      }
    });

    this.createForm();

    combineLatest([this.appointmentForm.get('examList')?.valueChanges.pipe(filter((examList) => !!examList?.length))])
      .pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe((res) => {
        console.log(res);
      });

    this.appointmentForm
      .get('startedAt')
      ?.valueChanges.pipe(takeUntil(this.destroy$$))
      .subscribe((selectedDate) => {
        const newDate = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
        this.shareDataSvc.setDate(newDate);
      });

    this.examApiService.exams$.pipe(takeUntil(this.destroy$$)).subscribe((exams) => {
      this.examList = this.nameValuePipe.transform(exams, 'name', 'id', 'expensive');
    });

    this.physicianApiSvc.physicians$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((physicians) => (this.physicianList = this.nameValuePipe.transform(physicians, 'firstname', 'id')));

    this.staffApiSvc
      .getUsersByType(UserType.General)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((staffs) => (this.userList = this.nameValuePipe.transform(staffs, 'firstname', 'id')));

    this.appointmentForm
      .get('startedAt')
      ?.valueChanges.pipe(
        debounceTime(0),
        filter((startedAt) => startedAt?.day && this.formValues.examList?.length),
        map((date) => {
          this.examIdToAppointmentSlots = {};
          this.selectedTimeSlot = {};
          this.slots = [];
          return this.createSlotRequestData(date, this.formValues.examList);
        }),
        switchMap((reqData) => this.appointmentApiSvc.getSlots$(reqData)),
      )
      .subscribe((slots) => this.setSlots(slots[0].slots));

    this.appointmentForm
      .get('examList')
      ?.valueChanges.pipe(
        debounceTime(0),
        tap(() => this.updateEventCard()),
        filter((examList) => examList?.length && this.formValues.startedAt?.day),
        map((examList) => {
          this.examIdToAppointmentSlots = {};
          this.selectedTimeSlot = {};
          this.slots = [];
          return this.createSlotRequestData(this.formValues.startedAt, examList);
        }),
        switchMap((reqData) => this.appointmentApiSvc.getSlots$(reqData)),
      )
      .subscribe((slots) => this.setSlots(slots[0].slots));
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public close(result: boolean) {
    this.modalSvc.close(result);
  }

  private createForm() {
    this.appointmentForm = this.fb.group({
      patientFname: [null, [Validators.required]],
      patientLname: [null, [Validators.required]],
      patientTel: [null, [Validators.required]],
      patientEmail: [null, [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      doctorId: [null, [Validators.required]],
      startedAt: [null, [Validators.required]],
      // startTime: [null, [Validators.required]],
      // roomType: [null, [Validators.required]],
      examList: [[], [Validators.required]],
      userId: [null, []],
      comments: [null, []],
    });

    if (this.modalData?.startedAt) {
      const date = new Date(this.modalData.startedAt);
      const startedAt = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
      this.appointmentForm.patchValue({ startedAt }, { emitEvent: true });
    }
  }

  public get formValues(): FormValues {
    return this.appointmentForm?.value;
  }

  public toggleMenu(tabNumber: number) {
    this.activeMenu = tabNumber;
  }

  private createSlotRequestData(date: { day: number; month: number; year: number }, examList: number[]): AppointmentSlotsRequestData {
    const dateString = `${date.year}-${date.month + 1}-${date.month}`;
    return {
      exams: examList,
      fromDate: dateString,
      toDate: dateString,
    } as AppointmentSlotsRequestData;
  }

  private setSlots(slots: Slot[]) {
    console.log(slots);
    this.slots = slots;
    this.slots.forEach((slot) => {
      if (!this.examIdToAppointmentSlots[slot.examId]) {
        this.examIdToAppointmentSlots[slot.examId] = [];
      }

      this.examIdToAppointmentSlots[slot.examId].push(slot);
    });
  }

  public checkSlotAvailable(examId: number) {
    const timeString = Object.values(this.selectedTimeSlot)[0];

    for (const slot of this.examIdToAppointmentSlots[examId]) {
      if (slot.start.slice(0, 8) === timeString) {
        return true;
      }
    }

    return false;
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
      this.updateEventCard(slot);
    }
  }

  public saveAppointment(): void {
    if (this.appointmentForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.appointmentForm.markAsDirty({ onlySelf: true });
    }

    // const { startedAt, ...rest } = this.formValues;
    // const time = this.selectedTime.split(':');
    // const requestData = {
    //   ...rest,
    //   startedAt: `${startedAt.year}-${startedAt.month}-${startedAt.day} ${time[0]}:${time[1]}`,
    // } as AddAppointmentRequestData;
    //
    // this.appointmentApiSvc
    //   .saveAppointment$(requestData)
    //   .pipe(takeUntil(this.destroy$$))
    //   .subscribe(() => {
    //     this.notificationSvc.showNotification(`Appointment saved successfully`);
    //     this.modalSvc.close(true);
    //   });
  }

  private updateEventCard(slot?: Slot) {
    const { element } = this.modalData;

    let totalExpense = 0;

    this.formValues.examList.forEach((examID) => {
      const foundExam = this.examList.find((exam) => +exam.value === +examID);

      if (foundExam?.description && !Number.isNaN(+foundExam.description)) {
        totalExpense += +foundExam.description;
      }
    });

    if (!this.formValues.examList?.length) {
      totalExpense = 5;
    }

    if (slot) {
      const hour = +slot.start.slice(0, 2);
      const min = +slot.start.slice(3, 5);
      const height = (hour * 60 + min) * this.pixelPerMinute;

      element.style.top = `${height}px`;

      setTimeout(() => this.scrollIntoView(), 0);
    }

    element.style.height = `${totalExpense * this.pixelPerMinute}px`;
  }

  private scrollIntoView() {
    this.modalData.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}
