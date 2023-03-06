import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BehaviorSubject, combineLatest, debounceTime, filter, map, switchMap, take, takeUntil, tap} from 'rxjs';
import {NotificationType} from 'diflexmo-angular-design';
import {ModalService} from '../../../../core/services/modal.service';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {ShareDataService} from '../../../../core/services/share-data.service';
import {ExamApiService} from '../../../../core/services/exam-api.service';
import {NameValuePairPipe} from '../../../../shared/pipes/name-value-pair.pipe';
import {NameValue} from '../../../../shared/components/search-modal.component';
import {AppointmentApiService} from '../../../../core/services/appointment-api.service';
import {
  AddAppointmentRequestData,
  CreateAppointmentFormValues,
  SelectedSlots,
  Slot,
  SlotModified
} from '../../../../shared/models/appointment.model';
import {PhysicianApiService} from '../../../../core/services/physician.api.service';
import {StaffApiService} from '../../../../core/services/staff-api.service';
import {UserType} from '../../../../shared/models/user.model';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {AppointmentUtils} from "../../../../shared/utils/appointment.utils";
import {SiteManagementApiService} from "../../../../core/services/site-management-api.service";
import {EMAIL_REGEX} from "../../../../shared/utils/const";
import {GeneralUtils} from "../../../../shared/utils/general.utils";

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

  public submitting$$ = new BehaviorSubject(false);

  public loadingSlots$$ = new BehaviorSubject(false);

  public filteredExamList: NameValue[] = [];

  private examList: NameValue[] = [];

  public filteredPhysicianList: NameValue[] = [];

  private physicianList: NameValue[] = [];

  public filteredUserList: NameValue[] = [];

  private userList: NameValue[] = [];

  private modalData!: {
    event: MouseEvent;
    element: HTMLDivElement;
    elementContainer: HTMLDivElement;
    startedAt: Date;
  };

  public slots: SlotModified[] = [];

  public selectedTimeSlot: SelectedSlots = {};

  public examIdToAppointmentSlots: { [key: number]: SlotModified[] } = {};

  public examIdToDetails: { [key: number]: { name: string; expensive: number } } = {};

  public selectedTime!: string;

  private pixelPerMinute = 4;

  public isCombinable: boolean = false;

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
    private siteManagementApiSvc: SiteManagementApiService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.siteManagementApiSvc.siteManagementData$.pipe(take(1)).subscribe((siteSettings) => {
      this.isCombinable = siteSettings.isSlotsCombinable;
    });

    this.modalSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data) => {
      this.modalData = data;

      if (this.modalData.event.offsetY) {
        const minutes = Math.round(+this.modalData.event.offsetY / this.pixelPerMinute);
        const roundedMin = minutes - (minutes % 5);
        const hour = `0${Math.floor(minutes / 60)}`.slice(-2);
        const min = `0${roundedMin % 60}`.slice(-2);
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

    this.examApiService.allExams$.pipe(takeUntil(this.destroy$$)).subscribe((exams) => {
      const keyValueExams = this.nameValuePipe.transform(exams, 'name', 'id');
      this.filteredExamList = [...keyValueExams];
      this.examList = [...keyValueExams];

      exams.forEach((exam) => {
        console.log(exam);
        if (!this.examIdToDetails[+exam.id]) {
          this.examIdToDetails[+exam.id] = {
            name: exam.name,
            expensive: exam.expensive,
          };
        }
      });
    });

    this.physicianApiSvc.physicians$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((physicians) => {
        const keyValuePhysicians = this.nameValuePipe.transform(physicians, 'firstname', 'id');
        this.filteredPhysicianList = [...keyValuePhysicians];
        this.physicianList = [...keyValuePhysicians];
      });

    this.staffApiSvc
      .getUsersByType(UserType.General)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((staffs) => {
        const keyValueExams = this.nameValuePipe.transform(staffs, 'firstname', 'id');
        this.filteredUserList = [...keyValueExams];
        this.userList = [...keyValueExams];
      });

    this.appointmentForm
      .get('startedAt')
      ?.valueChanges.pipe(
      debounceTime(0),
      filter((startedAt) => startedAt?.day && this.formValues.examList?.length),
      tap(() => this.loadingSlots$$.next(true)),
      map((date) => {
        this.clearSlotDetails();
        return AppointmentUtils.GenerateSlotRequestData(date, this.formValues.examList);
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
      tap(() => this.updateEventCard()),
      filter((examList) => examList?.length && this.formValues.startedAt?.day),
      tap(() => this.loadingSlots$$.next(true)),
      map((examList) => {
        this.clearSlotDetails();
        return AppointmentUtils.GenerateSlotRequestData(this.formValues.startedAt, examList);
      }),
      switchMap((reqData) => this.appointmentApiSvc.getSlots$(reqData)),
    )
      .subscribe((slots) => {
        this.setSlots(slots[0].slots)
        this.loadingSlots$$.next(false);
      });
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
      patientEmail: [null, []],
      doctorId: [null, []],
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
      this.appointmentForm.patchValue({startedAt}, {emitEvent: true});
    }
  }

  public get formValues(): CreateAppointmentFormValues {
    return this.appointmentForm?.value;
  }

  private setSlots(slots: Slot[]) {
    const {examIdToSlots, newSlots} = AppointmentUtils.GetModifiedSlotData(slots);
    console.log(examIdToSlots, newSlots)
    this.examIdToAppointmentSlots = examIdToSlots;
    this.slots = newSlots;
  }

  public checkSlotAvailability(slot: SlotModified) {
    return AppointmentUtils.IsSlotAvailable(slot, this.selectedTimeSlot);
  }

  public handleSlotSelectionToggle(slot: SlotModified) {
    AppointmentUtils.ToggleSlotSelection(slot, this.selectedTimeSlot);
  }

  public saveAppointment(): void {
    if (this.appointmentForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.appointmentForm.markAllAsTouched();
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
            examId: +examID
          }
        }
      })
    }

    const requestData: AddAppointmentRequestData = AppointmentUtils.GenerateAppointmentRequestData(
      {...this.formValues},
      {...this.selectedTimeSlot},
    );

    console.log(requestData);

    this.appointmentApiSvc
      .saveAppointment$(requestData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe({
        next: () => {
          this.notificationSvc.showNotification(`Appointment saved successfully`);
          this.submitting$$.next(false);
          this.modalSvc.close(true);
        },
        error: (err) => {
          this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
          this.submitting$$.next(false);
        }
      });
  }

  private updateEventCard(slot?: Slot) {
    const {element} = this.modalData;
    debugger;
    let totalExpense = 0;

    this.formValues.examList.forEach((examID) => {
      const expensive = +this.examIdToDetails[+examID].expensive;

      if (!Number.isNaN(+expensive)) {
        totalExpense += +expensive;
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

  public clearSlotDetails() {
    this.examIdToAppointmentSlots = {};
    this.selectedTimeSlot = {};
    this.slots = [];
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
