import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs';
import { InputComponent, NotificationType } from 'diflexmo-angular-design';
import { DatePipe } from '@angular/common';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { PriorityType, RepeatType } from '../../../../shared/models/absence.model';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { getNumberArray } from '../../../../shared/utils/getNumberArray';
import { WeekdayToNamePipe } from '../../../../shared/pipes/weekday-to-name.pipe';
import { MonthToNamePipe } from '../../../../shared/pipes/month-to-name.pipe';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { StaffsGroupedByType } from 'src/app/shared/models/staff.model';
import { User, UserType } from 'src/app/shared/models/user.model';
import { formatTime } from 'src/app/shared/utils/time';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';

interface FormValues {
  startedAt: any;
  slotStartTime: string;
  endedAt: any;
  slotEndTime: string;
  isRepeat: boolean;
  priority: PriorityType;
  repeatType: RepeatType;
  repeatFrequency: string;
  repeatDays: string[];
  userList: number[];
}

@Component({
  selector: 'dfm-add-priority-slots',
  templateUrl: './add-priority-slots.component.html',
  styleUrls: ['./add-priority-slots.component.scss'],
})
export class AddPrioritySlotsComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public prioritySlotForm!: FormGroup;

  public modalData!: { edit: boolean; prioritySlotDetails: PrioritySlot };

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

  public staffsGroupedByTypes$$ = new BehaviorSubject<StaffsGroupedByType>({
    assistants: [],
    radiologists: [],
    nursing: [],
    secretaries: [],
    mandatory: [],
  });

  public startTimes: NameValue[];

  public endTimes: NameValue[];

  public repeatEvery = {
    daily: [...this.getRepeatEveryItems(RepeatType.Daily)],
    weekly: [...this.getRepeatEveryItems(RepeatType.Weekly)],
    monthly: [...this.getRepeatEveryItems(RepeatType.Daily)],
  };

  public repeatTypeToName = {
    daily: 'Days',
    weekly: 'Weeks',
    monthly: 'Months',
  };

  public staffs$$ = new BehaviorSubject<NameValue[]>([] as NameValue[]);
  public isClicked: boolean = true;
  public isRepeatClicked: boolean = true;
  staffDetails: User[] =[];

  public minFromDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  };

  constructor(
    private modalSvc: ModalService,
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private weekdayToNamePipe: WeekdayToNamePipe,
    private monthToNamePipe: MonthToNamePipe,
    private staffApiSvc: StaffApiService,
    private datePipe: DatePipe,
    private timeInIntervalPipe: TimeInIntervalPipe,
    private nameValuePairPipe: NameValuePairPipe,
    private priorityApiSvc: PrioritySlotApiService,
  ) {
    super();
    const times = this.nameValuePairPipe.transform(this.timeInIntervalPipe.transform(30));
    this.startTimes = [...times];
    this.endTimes = [...times];
  }

  public ngOnInit(): void {
    this.modalSvc.dialogData$.pipe(take(1)).subscribe((data) => {
      this.modalData = data;
      this.createForm(this.modalData?.prioritySlotDetails);
      console.log("this.prioritySlotForm.get('isRepeat')?.value: ", this.prioritySlotForm.get('isRepeat')?.value);
    });

    this.staffApiSvc.staffList$.pipe(takeUntil(this.destroy$$)).subscribe((staffs) => {
      this.staffDetails = staffs;
      console.log('this.staffDetails: ', this.staffDetails);
      const staffGroupedByType: StaffsGroupedByType = {
        radiologists: [],
        assistants: [],
        nursing: [],
        secretaries: [],
        mandatory: [],
      };

      staffs.forEach((staff) => {
        const nameValue = { name: `${staff.firstname} ${staff.lastname}`, value: staff.id };
        staffGroupedByType.mandatory.push(nameValue);
        switch (staff.userType) {
          case UserType.Radiologist:
            staffGroupedByType.radiologists.push(nameValue);
            break;
          default:
        }
      });
      this.staffsGroupedByTypes$$.next({ ...staffGroupedByType });
    });

    this.prioritySlotForm
      .get('repeatType')
      ?.valueChanges.pipe(debounceTime(0), distinctUntilChanged(), takeUntil(this.destroy$$))
      .subscribe((value) => {
        this.prioritySlotForm.get('repeatDays')?.setValue(['']);
        if (this.formValues.repeatFrequency) {
          this.prioritySlotForm
            .get('repeatFrequency')
            ?.setValue(`${this.formValues.repeatFrequency.toString().split(' ')[0]} ${this.repeatTypeToName[value]}`);
        }
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get formValues(): FormValues {
    return this.prioritySlotForm.value;
  }

  private createForm(prioritySlotDetails?: PrioritySlot | undefined): void {
    let slotStartTime;
    let slotEndTime;

    if (prioritySlotDetails?.startedAt) {
      const date = new Date(prioritySlotDetails.startedAt);
      slotStartTime = this.datePipe.transform(date, 'HH:mm');

      if (slotStartTime) {
        this.startTimes.push({ name: slotStartTime, value: slotStartTime });
      }
    }

    if (prioritySlotDetails?.endedAt) {
      const date = new Date(prioritySlotDetails.endedAt);
      slotEndTime = this.datePipe.transform(date, 'HH:mm');
      this.endTimes.push({ name: slotEndTime, value: slotEndTime });
    }

    if (this.modalData?.prioritySlotDetails && prioritySlotDetails?.isRepeat) {
      this.isRepeatClicked = true;
      this.isClicked = false;
    }

    // if (this.modalData?.prioritySlotDetails && prioritySlotDetails?.isRepeat) {
    //   this.isRepeatClicked = false;
    //   this.isClicked = true;
    // }



    const radiologists: string[] = [];

    if (this.staffDetails.length) {
      console.log('this.staffDetails: ', this.staffDetails);
      this.staffDetails.forEach((u) => {
        switch (u.userType) {
          case UserType.Radiologist:
            radiologists.push(u.id.toString());
            break;
          default:
        }
      });

      this.prioritySlotForm.patchValue({
        radiologists,
      });
    }


    this.prioritySlotForm = this.fb.group({
      startedAt: [
        prioritySlotDetails?.startedAt
          ? {
              year: new Date(prioritySlotDetails.startedAt).getFullYear(),
              month: new Date(prioritySlotDetails.startedAt).getMonth(),
              day: new Date(prioritySlotDetails.startedAt).getDate(),
            }
          : null,
        [Validators.required],
      ],
      endedAt: [
        prioritySlotDetails?.endedAt
          ? {
              year: new Date(prioritySlotDetails.endedAt).getFullYear(),
              month: new Date(prioritySlotDetails.endedAt).getMonth(),
              day: new Date(prioritySlotDetails.endedAt).getDate(),
            }
          : null,
        [],
      ],


      isRepeat: [!!prioritySlotDetails?.isRepeat, []],
      slotStartTime: [slotStartTime, [Validators.required]],
      slotEndTime: [slotEndTime, []],
      priority: [prioritySlotDetails?.priority, [Validators.required]],
      repeatType: [prioritySlotDetails?.repeatType ?? null, []],
      repeatDays: [prioritySlotDetails?.repeatDays ? prioritySlotDetails.repeatDays.split(',') : '', []],
      repeatFrequency: [prioritySlotDetails?.repeatFrequency ?? null, []],
      userList: [radiologists ?? [], [Validators.required]],
    });

    // const fa = this.prioritySlotForm.get('addPriority') as FormArray;

    // if (prioritySlotDetails && prioritySlotDetails?.priority?.length) {
    //   prioritySlotDetails.addPriority.forEach((exam) => {
    //     fa.push(this.newPrioritySlots(+exam));
    //   });
    // } else {
    //   fa.push(this.newExam());
    // }
  }

  public closeModal(res: boolean) {
    this.modalSvc.close(res);
    this.ngOnDestroy();
  }

  setRepeatValue() {
    console.log("this.prioritySlotForm.get('isRepeat')?.value: ", this.prioritySlotForm.get('isRepeat')?.value);
    if (this.prioritySlotForm.get('isRepeat')?.value === false) {
      this.isClicked = false;
      this.isRepeatClicked = true;
    }
  }

  public savePrioritySlot() {

    console.log(this.formValues);

    const { startedAt, endedAt, repeatDays, slotStartTime, slotEndTime, ...rest } = this.formValues;

    console.log('rest.repeatFrequency: ', rest.repeatFrequency);
    const addPriorityReqData: PrioritySlot = {
      ...rest,
      startedAt: new Date(startedAt.year, startedAt.month, startedAt.day, +slotStartTime.slice(0, 2), +slotStartTime.slice(3, 5)).toISOString(),
      endedAt: (endedAt)? new Date(endedAt?.year, endedAt?.month, endedAt?.day, +slotEndTime.slice(0, 2), +slotEndTime.slice(3, 5)).toISOString() : '',
      repeatDays: this.prioritySlotForm.get('repeatDays')?.value,
      repeatFrequency: rest.repeatFrequency ? +rest.repeatFrequency : 0,
      id: 0,
      slotStartTime: slotStartTime,
      slotEndTime: slotEndTime,
    };

    if (repeatDays.length) {
      addPriorityReqData.repeatDays = repeatDays?.reduce((acc, curr, i) => {
        if (repeatDays?.length && i < repeatDays.length - 1) {
          return `${acc + curr},`;
        }
        return acc + curr;
      }, '');
    }

    if (this.modalData?.prioritySlotDetails?.id) {
      addPriorityReqData.id = this.modalData.prioritySlotDetails.id;
    }

    console.log(addPriorityReqData);
    if (this.modalData.edit) {
      console.log("update called");
      
      this.priorityApiSvc
        .updatePrioritySlot$(addPriorityReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(() => {
          this.notificationSvc.showNotification(`Priority Slot updated successfully`);
          this.closeModal(true);
        });
    }else{
      console.log("save called");

      this.priorityApiSvc
        .savePrioritySlot$(addPriorityReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(() => {
          this.notificationSvc.showNotification(`Priority Slot added successfully`);
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

  public handleTimeInput(time: string, controlName: 'slotStartTime' | 'slotEndTime') {
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
      case 'slotStartTime':
        if (!this.startTimes.find((t) => t.value === formattedTime)) {
          this.startTimes.splice(0, 0, nameValue);
        }
        break;
      case 'slotEndTime':
        if (!this.endTimes.find((t) => t.value === formattedTime)) {
          this.endTimes.splice(0, 0, nameValue);
        }
        break;
      default:
        return;
    }

    this.prioritySlotForm.patchValue({
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
