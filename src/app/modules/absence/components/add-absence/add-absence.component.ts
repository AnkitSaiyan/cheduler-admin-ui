import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs';
import { InputComponent, NotificationType } from 'diflexmo-angular-design';
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
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { formatTime } from '../../../../shared/utils/formatTime';

interface FormValues {
  name: string;
  startedAt: any;
  startTime: string;
  endedAt: any;
  endTime: string;
  isRepeat: boolean;
  isHoliday: boolean;
  priority: PriorityType;
  repeatType: RepeatType;
  repeatFrequency: string;
  repeatDays: string[];
  userList: number[];
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

  public roomList$$ = new BehaviorSubject<NameValue[]>([] as NameValue[])

  // public staffList: NameValue[] = [];

  public startTimes: NameValue[];

  public endTimes: NameValue[];

  public repeatEvery = {
    // daily: [...this.getRepeatEveryItems(RepeatType.Daily)],
    weekly: [...this.getRepeatEveryItems(RepeatType.Weekly)],
    monthly: [...this.getRepeatEveryItems(RepeatType.Daily)],
  };

  public repeatTypeToName = {
    daily: 'Days',
    weekly: 'Weeks',
    monthly: 'Months',
  };

  
  public staffs$$ = new BehaviorSubject<NameValue[]>([] as NameValue[]);


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
    private timeInIntervalPipe: TimeInIntervalPipe,
    private nameValuePairPipe: NameValuePairPipe,
  ) {
    super();
    const times = this.nameValuePairPipe.transform(this.timeInIntervalPipe.transform(30));
    this.startTimes = [...times];
    this.endTimes = [...times];
  }

  public ngOnInit(): void {
    this.modalSvc.dialogData$.pipe(take(1)).subscribe((data) => {
      this.modalData = data;
      this.createForm(this.modalData?.absenceDetails);
    });

    this.roomApiSvc.rooms$.pipe(takeUntil(this.destroy$$)).subscribe((rooms) => {
      this.roomList$$.next(rooms.map((room) => ({ name: room.name, value: room.id })) as NameValue[]);
    });

    this.staffApiSvc.staffList$.pipe(takeUntil(this.destroy$$)).subscribe((staffs) => {
      this.staffs$$.next(staffs.map((staff) => ({ name: staff.firstname, value: staff.id })) as NameValue[]);

    });

    this.absenceForm
      .get('repeatType')
      ?.valueChanges.pipe(debounceTime(0), distinctUntilChanged(), takeUntil(this.destroy$$))
      .subscribe((value) => {
        this.absenceForm.get('repeatDays')?.setValue(['']);
        if (this.formValues.repeatFrequency) {
          this.absenceForm
            .get('repeatFrequency')
            ?.setValue(`${this.formValues.repeatFrequency.toString().split(' ')[0]} ${this.repeatTypeToName[value]}`);
        }
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get formValues(): FormValues {
    return this.absenceForm.value;
  }

  private createForm(absenceDetails?: Absence | undefined): void {
    let startTime;
    let endTime;

    if (absenceDetails?.startedAt) {
      const date = new Date(absenceDetails.startedAt);
      startTime = this.datePipe.transform(date, 'hh:mmaa');

      if (startTime) {
        this.startTimes.push({ name: startTime, value: startTime });
      }
    }

    if (absenceDetails?.endedAt) {
      const date = new Date(absenceDetails.endedAt);
      endTime = this.datePipe.transform(date, 'hh:mmaa');
      this.endTimes.push({ name: endTime, value: endTime });
    }

    this.absenceForm = this.fb.group({
      name: [absenceDetails?.name ?? '', [Validators.required]],
      startedAt: [
        absenceDetails?.startedAt
          ? {
              year: new Date(absenceDetails.startedAt).getFullYear(),
              month: new Date(absenceDetails.startedAt).getMonth(),
              day: new Date(absenceDetails.startedAt).getDate(),
            }
          : null,
        [Validators.required],
      ],
      startTime: [startTime, [Validators.required]],
      endedAt: [
        absenceDetails?.endedAt
          ? {
              year: new Date(absenceDetails.endedAt).getFullYear(),
              month: new Date(absenceDetails.endedAt).getMonth(),
              day: new Date(absenceDetails.endedAt).getDate(),
            }
          : null,
        [Validators.required],
      ],
      endTime: [endTime, [Validators.required]],
      isRepeat: [!!absenceDetails?.isRepeat, []],
      isHoliday: [!!absenceDetails?.isHoliday, []],
      repeatType: [absenceDetails?.repeatType ?? null, []],
      repeatDays: [absenceDetails?.repeatDays ? absenceDetails.repeatDays.split(',') : '', []],
      repeatFrequency: [absenceDetails?.repeatFrequency ?? null, []],
      userList: [absenceDetails?.userList ?? [], [Validators.required]],
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

    const { startedAt, endedAt, repeatDays, startTime, endTime, ...rest } = this.formValues;

    console.log('rest.repeatFrequency: ', rest.repeatFrequency);
    const addAbsenceReqData: AddAbsenceRequestDate = {
      ...rest,
      startedAt: new Date(startedAt.year, startedAt.month, startedAt.day, +startTime.slice(0, 2), +startTime.slice(3, 5)).toISOString(),
      endedAt: new Date(endedAt.year, endedAt.month, endedAt.day, +endTime.slice(0, 2), +endTime.slice(3, 5)).toISOString(),
      repeatDays: this.absenceForm.get('repeatDays')?.value,
      repeatFrequency: rest.repeatFrequency ? +rest.repeatFrequency : 0,
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
    if (this.modalData.edit) {
      
      this.absenceApiSvc
        .updateAbsence(addAbsenceReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(() => {
          this.notificationSvc.showNotification(`Absence updated successfully`);
          this.closeModal(true);
        });
    }else{
      this.absenceApiSvc
        .addNewAbsence$(addAbsenceReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(() => {
          this.notificationSvc.showNotification(`Absence added successfully`);
          this.closeModal(true);
        });
    }
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

  public handleTimeInput(time: string, controlName: 'startTime' | 'endTime') {
    const formattedTime = formatTime(time);

    console.log(formattedTime);

    if (!formattedTime) {
      return;
    }

    const nameValue = {
      name: formattedTime,
      value: formattedTime,
    };

    switch (controlName) {
      case 'startTime':
        if (!this.startTimes.find((t) => t.value === formattedTime)) {
          this.startTimes.splice(0, 0, nameValue);
        }
        break;
      case 'endTime':
        if (!this.endTimes.find((t) => t.value === formattedTime)) {
          this.endTimes.splice(0, 0, nameValue);
        }
        break;
      default:
        return;
    }

    this.absenceForm.patchValue({
      [controlName]: formattedTime,
    });
  }

  public handleFocusOut(repeatFrequency: InputComponent) {
    let { value } = repeatFrequency;
    // eslint-disable-next-line no-param-reassign
    repeatFrequency.type = 'text';
    if (!value.toString().includes(this.repeatTypeToName[this.formValues.repeatType]) && +value > 0) {
      value += ` ${this.repeatTypeToName[this.formValues.repeatType]}`;
      // eslint-disable-next-line no-param-reassign
      repeatFrequency.value = value;
    }
  }

  public handleFocusIn(repeatFrequency: InputComponent) {
    const { value } = repeatFrequency;

    // eslint-disable-next-line no-param-reassign
    repeatFrequency.type = 'number';
    if (repeatFrequency.value) {
      const num = value.split(' ')[0];
      if (num && !Number.isNaN(+num)) {
        // eslint-disable-next-line no-param-reassign
        repeatFrequency.value = +num;
      }
    }
  }

  public handleChange(repeatFrequency: InputComponent) {
    console.log(repeatFrequency);
  }
}
