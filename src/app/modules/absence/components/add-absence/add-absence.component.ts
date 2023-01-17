import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import _default from 'chart.js/dist/core/core.interaction';
import { DatePipe } from '@angular/common';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { Absence, AddAbsenceRequestDate, PriorityType, RepeatType } from '../../../../shared/models/absence.model';
import { AbsenceApiService } from '../../../../core/services/absence-api.service';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { getNumberArray } from '../../../../shared/utils/getNumberArray';
import { WeekdayToNamePipe } from '../../../../shared/pipes/weekday-to-name.pipe';
import { MonthToNamePipe } from '../../../../shared/pipes/month-to-name.pipe';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { StaffApiService } from '../../../../core/services/staff-api.service';

interface FormValues {
  name: string;
  startedAt: any;
  endedAt: any;
  isRepeat: boolean;
  isHoliday: boolean;
  priority: PriorityType;
  repeatType: RepeatType;
  repeatFrequency: number;
  repeatDays: string[];
  staffList: number[];
  roomList: number[];
  info: string;
}

@Component({
  selector: 'dfm-add-absence',
  templateUrl: './add-absence.component.html',
  styleUrls: ['./add-absence.component.scss'],
})
export class AddAbsenceComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public absenceForm!: FormGroup;

  public modalData!: { edit: boolean; absenceDetails: Absence };

  public priorityType = PriorityType;

  public repeatTypes = [
    {
      name: 'Daily',
      value: RepeatType.Daily,
    },
    {
      name: 'Weekly',
      value: RepeatType.Weekly,
    },
    {
      name: 'Monthly',
      value: RepeatType.Monthly,
    },
  ];

  public roomList: NameValue[] = [];

  public staffList: NameValue[] = [];

  public repeatEvery = {
    daily: [...this.getRepeatEveryItems(RepeatType.Daily)],
    weekly: [...this.getRepeatEveryItems(RepeatType.Weekly)],
    monthly: [...this.getRepeatEveryItems(RepeatType.Monthly)],
  };

  constructor(
    private modalSvc: ModalService,
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private absenceApiSvc: AbsenceApiService,
    private weekdayToNamePipe: WeekdayToNamePipe,
    private monthToNamePipe: MonthToNamePipe,
    private roomApiSvc: RoomsApiService,
    private staffApiSvc: StaffApiService,
    private datePipe: DatePipe,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.modalSvc.dialogData$.pipe(take(1)).subscribe((data) => {
      this.modalData = data;
      this.createForm(this.modalData?.absenceDetails);
    });

    this.roomApiSvc.rooms$.pipe(takeUntil(this.destroy$$)).subscribe((rooms) => {
      rooms.forEach((room) => this.roomList.push({ name: room.name, value: room.id }));
    });

    this.staffApiSvc.staffList$.pipe(takeUntil(this.destroy$$)).subscribe((staffs) => {
      staffs.forEach((staff) =>
        this.staffList.push({
          name: `${staff.firstname} ${staff.lastname}`,
          value: staff.id,
        }),
      );
    });

    this.absenceForm
      .get('repeatType')
      ?.valueChanges.pipe(debounceTime(0), distinctUntilChanged(), takeUntil(this.destroy$$))
      .subscribe(() => this.absenceForm.get('repeatDays')?.setValue([]));
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get formValues(): FormValues {
    return this.absenceForm.value;
  }

  private createForm(absenceDetails?: Absence | undefined): void {
    this.absenceForm = this.fb.group({
      name: [absenceDetails?.name ?? '', [Validators.required]],
      startedAt: [
        absenceDetails?.startedAt
          ? {
              year: new Date(absenceDetails.startedAt).getFullYear(),
              month: new Date(absenceDetails.startedAt).getMonth() + 1,
              day: new Date(absenceDetails.startedAt).getDate(),
            }
          : null,
        [Validators.required],
      ],
      endedAt: [
        absenceDetails?.endedAt
          ? {
              year: new Date(absenceDetails.endedAt).getFullYear(),
              month: new Date(absenceDetails.endedAt).getMonth() + 1,
              day: new Date(absenceDetails.endedAt).getDate(),
            }
          : null,
        [Validators.required],
      ],
      isRepeat: [!!absenceDetails?.isRepeat, []],
      isHoliday: [!!absenceDetails?.isHoliday, []],
      repeatType: [absenceDetails?.repeatType ?? null, []],
      repeatDays: [absenceDetails?.repeatDays ? absenceDetails.repeatDays.split(',') : '', []],
      staffList: [absenceDetails?.staffList ?? [], [Validators.required]],
      roomList: [absenceDetails?.roomList ?? [], [Validators.required]],
      info: [absenceDetails?.info ?? '', [Validators.required]],
      priority: [absenceDetails?.priority ?? null, []],
    });
  }

  public closeModal(res: boolean) {
    this.modalSvc.close(res);
    this.ngOnDestroy();
  }

  public saveAbsence() {
    if (this.absenceForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.absenceForm.updateValueAndValidity();
      return;
    }

    console.log(this.formValues);

    const { startedAt, endedAt, repeatDays, ...rest } = this.formValues;

    const addAbsenceReqData: AddAbsenceRequestDate = {
      ...rest,
      startedAt: new Date(startedAt.year, startedAt.month, startedAt.day).toDateString(),
      endedAt: new Date(endedAt.year, endedAt.month, endedAt.day).toDateString(),
      repeatDays: '',
    };

    if (repeatDays.length) {
      addAbsenceReqData.repeatDays = repeatDays?.reduce((acc, curr, i) => {
        if (repeatDays?.length && i < repeatDays.length - 1) {
          return `${acc + curr},`;
        }
        return acc + curr;
      }, '');
    }

    if (this.modalData?.absenceDetails?.id) {
      addAbsenceReqData.id = this.modalData.absenceDetails.id;
    }

    console.log(addAbsenceReqData);

    this.absenceApiSvc
      .upsertAbsence$(addAbsenceReqData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification(`Absence ${this.modalData.edit ? 'updated' : 'added'} successfully`);
        this.closeModal(true);
      });
  }

  private getRepeatEveryItems(repeatType: RepeatType): NameValue[] {
    switch (repeatType) {
      case RepeatType.Daily:
        return getNumberArray(31).map((d) => ({ name: d.toString(), value: d.toString() }));
      case RepeatType.Weekly:
        return getNumberArray(7).map((w) => ({ name: this.weekdayToNamePipe.transform(w), value: w.toString() }));
      case RepeatType.Monthly:
        return getNumberArray(12).map((m) => ({ name: this.monthToNamePipe.transform(m), value: m.toString() }));
      default:
        return [];
    }
  }
}
