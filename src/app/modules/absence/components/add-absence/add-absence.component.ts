import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, map, of, startWith, switchMap, take, takeUntil } from 'rxjs';
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
import { formatTime, timeToNumber } from '../../../../shared/utils/time';
import { toggleControlError } from '../../../../shared/utils/toggleControlError';

interface FormValues {
  name: string;
  startedAt: {
    year: number;
    month: number;
    day: number;
  };
  startTime: string;
  endedAt: {
    year: number;
    month: number;
    day: number;
  };
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
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAbsenceComponent extends DestroyableComponent implements OnInit, OnDestroy {
  @ViewChild('repeatFrequency')
  private repeatFrequency!: InputComponent;

  public absenceForm!: FormGroup;

  public roomList$$ = new BehaviorSubject<NameValue[] | null>(null);

  public staffs$$ = new BehaviorSubject<NameValue[] | null>(null);

  public submitting$$ = new BehaviorSubject<boolean>(false);

  public absence$$ = new BehaviorSubject<Absence | null>(null);

  public modalData!: { edit: boolean; absenceID: number };

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

  public minFromDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
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
    private timeInIntervalPipe: TimeInIntervalPipe,
    private nameValuePairPipe: NameValuePairPipe,
    private cdr: ChangeDetectorRef,
  ) {
    super();

    const times = this.nameValuePairPipe.transform(this.timeInIntervalPipe.transform(5));
    this.startTimes = [...times];
    this.endTimes = [...times];
  }

  public ngOnInit(): void {
    this.modalSvc.dialogData$
      .pipe(
        switchMap((modalData) => {
          this.modalData = modalData;
          if (modalData?.absenceID) {
            return this.absenceApiSvc.getAbsenceByID$(modalData.absenceID);
          }
          return of({} as Absence);
        }),
        take(1),
      )
      .subscribe((absence) => {
        this.absence$$.next(absence);
        this.createForm(absence);
      });

    this.roomApiSvc.rooms$
      .pipe(
        map((rooms) => rooms.filter((room) => !!room.status)),
        takeUntil(this.destroy$$),
      )
      .subscribe((rooms) => {
        this.roomList$$.next(rooms.map((room) => ({ name: room.name, value: room.id.toString() })) as NameValue[]);
        this.cdr.detectChanges();
      });

    this.staffApiSvc.staffList$
      .pipe(
        map((staffs) => staffs.filter((staff) => !!staff.status)),
        takeUntil(this.destroy$$),
      )
      .subscribe((staffs) => {
        this.staffs$$.next(staffs.map((staff) => ({ name: staff.firstname, value: staff.id.toString() })) as NameValue[]);
        this.cdr.detectChanges();
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
      startTime = this.datePipe.transform(date, 'HH:mm');

      if (startTime && !this.startTimes.find((time) => time.value === startTime)) {
        this.startTimes.push({ name: startTime, value: startTime });
      }
    }

    if (absenceDetails?.endedAt) {
      const date = new Date(absenceDetails.endedAt);
      endTime = this.datePipe.transform(date, 'HH:mm');

      if (endTime && !this.endTimes.find((time) => time.value === endTime)) {
        this.endTimes.push({ name: endTime, value: endTime });
      }
    }

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
      startTime: [startTime, [Validators.required]],
      endedAt: [
        absenceDetails?.endedAt
          ? {
              year: new Date(absenceDetails.endedAt).getFullYear(),
              month: new Date(absenceDetails.endedAt).getMonth() + 1,
              day: new Date(absenceDetails.endedAt).getDate(),
            }
          : null,
        [],
      ],
      endTime: [endTime, []],
      isRepeat: [!!absenceDetails?.isRepeat, []],
      isHoliday: [!!absenceDetails?.isHoliday, []],
      repeatType: [absenceDetails?.repeatType ?? null, []],
      repeatDays: [absenceDetails?.repeatDays ? absenceDetails.repeatDays.split(',') : '', []],
      repeatFrequency: [
        absenceDetails?.isRepeat && absenceDetails?.repeatFrequency && absenceDetails.repeatType
          ? `${absenceDetails.repeatFrequency} ${this.repeatTypeToName[absenceDetails.repeatType]}`
          : null,
        [Validators.min(1)],
      ],
      userList: [absenceDetails?.user?.length ? absenceDetails.user.map(({ id }) => id?.toString()) : [], []],
      roomList: [absenceDetails?.rooms?.length ? absenceDetails?.rooms.map(({ id }) => id?.toString()) : [], []],
      info: [absenceDetails?.info ?? '', [Validators.required]],
      priority: [absenceDetails?.priority ?? null, []],
    });

    this.cdr.detectChanges();

    this.absenceForm
      .get('repeatType')
      ?.valueChanges.pipe(debounceTime(0), distinctUntilChanged(), takeUntil(this.destroy$$))
      .subscribe(() => {
        this.absenceForm.get('repeatDays')?.setValue(null);
        this.updateRepeatFrequency();
      });

    combineLatest([
      this.absenceForm.get('startTime')?.valueChanges.pipe(startWith('')),
      this.absenceForm.get('endTime')?.valueChanges.pipe(startWith('')),
      this.absenceForm.get('startedAt')?.valueChanges.pipe(startWith('')),
      this.absenceForm.get('endedAt')?.valueChanges.pipe(startWith('')),
    ])
      .pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe(() => {
        this.handleTimeChange();
      });
  }

  public closeModal(res: boolean) {
    this.modalSvc.close(res);
    // this.ngOnDestroy();
  }

  public saveAbsence() {
    if (this.formValues.isRepeat) {
      if (this.absenceForm.invalid) {
        this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);

        Object.keys(this.absenceForm.controls).map((key) => this.absenceForm.get(key)?.markAsTouched());

        return;
      }
    } else {
      const { controls } = this.absenceForm;
      const invalid = ['name', 'startedAt', 'startTime', 'info'].some((key) => {
        controls[key].markAsTouched();
        return controls[key].invalid;
      });

      if (invalid) {
        this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
        return;
      }
    }

    this.submitting$$.next(true);

    const { startedAt, endedAt, repeatDays, startTime, endTime, userList, roomList, ...rest } = this.formValues;

    const addAbsenceReqData: AddAbsenceRequestDate = {
      ...rest,
      startedAt: `${startedAt.year}-${startedAt.month}-${startedAt.day} ${startTime}:00`,
      endedAt: rest.isRepeat
        ? `${endedAt.year}-${endedAt.month}-${endedAt.day} ${endTime}:00`
        : `${startedAt.year}-${startedAt.month}-${startedAt.day} ${endTime}:00`,
      userList: rest.isHoliday ? [] : userList,
      roomList: rest.isHoliday ? [] : roomList,
      repeatType: rest.isRepeat ? rest.repeatType : null,
      repeatFrequency: rest.isRepeat && rest.repeatFrequency ? +rest.repeatFrequency.toString().split(' ')[0] : 0,
      repeatDays: '',
    };

    if (rest.isRepeat && repeatDays?.length) {
      addAbsenceReqData.repeatDays = repeatDays?.reduce((acc, curr, i) => {
        if (repeatDays?.length && i < repeatDays.length - 1) {
          return `${acc + curr},`;
        }
        return acc + curr;
      }, '');
    }

    if (this.modalData?.absenceID) {
      addAbsenceReqData.id = this.modalData.absenceID;
    }

    if (this.modalData.edit) {
      this.absenceApiSvc
        .updateAbsence(addAbsenceReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(
          () => {
            this.notificationSvc.showNotification(`Absence updated successfully`);
            this.submitting$$.next(false);
            this.closeModal(true);
          },
          (err) => {
            this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
            this.submitting$$.next(false);
          },
        );
    } else {
      this.absenceApiSvc
        .addNewAbsence$(addAbsenceReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(
          () => {
            this.notificationSvc.showNotification(`Absence added successfully`);
            this.submitting$$.next(false);
            this.closeModal(true);
          },
          (err) => {
            this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
            this.submitting$$.next(false);
          },
        );
    }
  }

  private getRepeatEveryItems(repeatType: RepeatType): NameValue[] {
    switch (repeatType) {
      case RepeatType.Daily:
        return getNumberArray(31).map((d) => ({ name: d.toString(), value: d.toString() }));
      case RepeatType.Weekly:
        return getNumberArray(6, 0).map((w) => ({ name: this.weekdayToNamePipe.transform(w), value: w.toString() }));
      case RepeatType.Monthly:
        return getNumberArray(12).map((m) => ({ name: this.monthToNamePipe.transform(m), value: m.toString() }));
      default:
        return [];
    }
  }

  public handleTimeInput(time: string, controlName: 'startTime' | 'endTime') {
    const formattedTime = formatTime(time, 24, 5);

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

    this.absenceForm.patchValue(
      {
        [controlName]: formattedTime,
      },
      { emitEvent: false },
    );
  }

  public handleFocusOut() {
    this.updateRepeatFrequency();
  }

  public handleFocusIn() {
    this.updateRepeatFrequency('number');
  }

  private updateRepeatFrequency(type: 'number' | 'text' = 'text') {
    if (!this.repeatFrequency?.value || !this.formValues.repeatFrequency) {
      return;
    }

    const { repeatFrequency } = this.formValues;

    switch (type) {
      case 'text':
        this.repeatFrequency.type = 'text';
        if (
          !repeatFrequency.toString().includes(this.repeatTypeToName[this.formValues.repeatType]) &&
          +repeatFrequency.toString().split(' ')[0] > 0
        ) {
          this.absenceForm.patchValue({
            repeatFrequency: `${repeatFrequency.toString().split(' ')[0]} ${this.repeatTypeToName[this.formValues.repeatType]}`,
          });
        }
        this.cdr.detectChanges();
        break;
      case 'number':
        if (repeatFrequency.split(' ')[0] && !Number.isNaN(+repeatFrequency.split(' ')[0])) {
          this.absenceForm.patchValue({
            repeatFrequency: +repeatFrequency.split(' ')[0],
          });
        }
        this.repeatFrequency.type = 'number';
        break;
      default:
    }
  }

  public handleChange(repeatFrequency: InputComponent) {
    console.log(repeatFrequency);
  }

  private handleTimeChange() {
    if (!this.formValues.startTime || !this.formValues.startedAt?.day || !this.formValues.endTime) {
      return;
    }

    const { startedAt, endedAt, startTime, endTime } = this.formValues;

    if (!this.formValues.isRepeat) {
      if (timeToNumber(startTime) >= timeToNumber(endTime)) {
        toggleControlError(this.absenceForm.get('startTime'), 'time');
        toggleControlError(this.absenceForm.get('endTime'), 'time');
      } else {
        toggleControlError(this.absenceForm.get('startTime'), 'time', false);
        toggleControlError(this.absenceForm.get('endTime'), 'time', false);
      }

      return;
    }

    if (!endedAt) {
      return;
    }

    if (startedAt.day === endedAt.day && startedAt.month === endedAt.month && startedAt.year === endedAt.year) {
      if (timeToNumber(startTime) >= timeToNumber(endTime)) {
        toggleControlError(this.absenceForm.get('startTime'), 'time');
        toggleControlError(this.absenceForm.get('endTime'), 'time');

        return;
      }

      // this.cdr.detectChanges();
    }

    toggleControlError(this.absenceForm.get('startTime'), 'time', false);
    toggleControlError(this.absenceForm.get('endTime'), 'time', false);
  }
}
