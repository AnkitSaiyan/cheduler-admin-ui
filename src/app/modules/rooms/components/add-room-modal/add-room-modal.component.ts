import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, debounceTime, of, switchMap, take, takeUntil } from 'rxjs';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BadgeColor, NotificationType } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ModalService } from '../../../../core/services/modal.service';
import { PracticeAvailability, PracticeAvailabilityServer } from '../../../../shared/models/practice.model';
import { Weekday } from '../../../../shared/models/calendar.model';
import { AddRoomRequestData, Room, RoomType } from '../../../../shared/models/rooms.model';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { Status } from '../../../../shared/models/status.model';
import { checkTimeRangeOverlapping, formatTime, get24HourTimeString, timeToNumber } from '../../../../shared/utils/time';
import { toggleControlError } from '../../../../shared/utils/toggleControlError';
import { TIME_24 } from '../../../../shared/utils/const';
import { getNumberArray } from '../../../../shared/utils/getNumberArray';

interface FormValues {
  name: string;
  description: string;
  type: RoomType;
  placeInAgenda: number;
  placeInAgendaIndex: number;
  practiceAvailabilityToggle: boolean;
  practiceAvailability: {
    [key: string]: {
      weekday: Weekday;
      dayStart: string;
      dayEnd: string;
      startTimings: NameValue[];
      endTimings: NameValue[];
    }[];
  };
  selectedWeekday: Weekday;
}

@Component({
  selector: 'dfm-add-room-modal',
  templateUrl: './add-room-modal.component.html',
  styleUrls: ['./add-room-modal.component.scss'],
})
export class AddRoomModalComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public addRoomForm!: FormGroup;

  public room$$ = new BehaviorSubject<Room | undefined>(undefined);

  public submitting$$ = new BehaviorSubject<boolean>(false);

  public modalData!: { edit: boolean; roomID: number; placeInAgendaIndex: number };

  public weekdayEnum = Weekday;

  private timings: NameValue[] = [];

  public filteredTimings: NameValue[] = [];

  public readonly interval: number = 5;

  public readonly invalidTimeError: string = 'invalidTime';

  public readonly invalidSlotRangeError: string = 'invalidSlot';

  public readonly slotExistsError: string = 'slotExists';

  constructor(
    private modalSvc: ModalService,
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private roomApiSvc: RoomsApiService,
    private nameValuePipe: NameValuePairPipe,
    private timeInIntervalPipe: TimeInIntervalPipe,
    private cdr: ChangeDetectorRef,
  ) {
    super();
    this.modalSvc.dialogData$
      .pipe(
        switchMap((modalData) => {
          this.modalData = modalData;
          if (modalData?.edit && modalData?.roomID) {
            return this.roomApiSvc.getRoomByID(modalData.roomID);
          }
          return of({} as Room);
        }),
        take(1),
      )
      .subscribe((room) => {
        this.room$$.next(room);
        this.createForm(room);
      });
  }

  public ngOnInit(): void {
    if (!this.modalData.edit) {
      this.roomApiSvc
        .getRoomByID(0)
        .pipe(take(1))
        .subscribe((room) => {
          this.addRoomForm.patchValue({ placeInAgenda: room.placeInAgenda });
        });
    }

    this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(this.interval))];
    this.filteredTimings = [...this.timings];
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get formValues(): FormValues {
    return this.addRoomForm.value;
  }

  private createForm(roomDetails?: Room | undefined): void {
    this.addRoomForm = this.fb.group({
      name: [roomDetails?.name ?? '', [Validators.required]],
      placeInAgenda: [roomDetails?.placeInAgenda, []],
      placeInAgendaIndex: [{ value: this.modalData?.placeInAgendaIndex, disabled: true }, [Validators.required]],
      description: [roomDetails?.description ?? '', []],
      type: [roomDetails?.type ?? null, [Validators.required]],
      selectedWeekday: [this.weekdayEnum.ALL, []],
      practiceAvailabilityToggle: [!!roomDetails?.availabilityType, []],
      practiceAvailability: this.fb.group({}),
      status: [this.modalData.edit ? roomDetails?.status : Status.Inactive, []],
    });

    if (roomDetails?.practiceAvailability?.length) {
      const weekdays = new Set([0, 1, 2, 3, 4, 5, 6]);

      roomDetails.practiceAvailability.forEach((practice) => {
        this.addRoomForm.patchValue({ selectedWeekday: practice.weekday });
        this.addPracticeAvailabilityControls(practice);
      });

      weekdays.forEach((weekday) => {
        this.addRoomForm.patchValue({ selectedWeekday: weekday });
        this.addPracticeAvailabilityControls();
      });

      this.addRoomForm.patchValue({ selectedWeekday: Weekday.ALL });
    }
  }

  public toggleAvailabilityForm(toggle: boolean): void {
    //  set practice availability toggle
    this.addRoomForm.get('practiceAvailabilityToggle')?.setValue(toggle, { emitEvent: false });
    if (toggle) {
      this.addPracticeAvailabilityControls();

      const controlsArrays = this.practiceAvailabilityWeekWiseControlsArray(true);
      this.handleSlotExistsError(controlsArrays);
      this.handleInvalidSlotRangeError(controlsArrays);

      this.cdr.detectChanges();
    }
  }

  private getPracticeAvailabilityFormGroup(weekday?: Weekday, dayStart?: string, dayEnd?: string): FormGroup {
    const fg = this.fb.group({
      weekday: [weekday ?? this.formValues.selectedWeekday, []],
      dayStart: [get24HourTimeString(dayStart), []],
      dayEnd: [get24HourTimeString(dayEnd), []],
      startTimings: [this.filteredTimings, []],
      endTimings: [this.filteredTimings, []],
    });

    fg.get('dayStart')
      ?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe((value) => {
        this.handleError(value as string, fg.get('dayStart'));
      });

    fg.get('dayEnd')
      ?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe((value) => {
        this.handleError(value as string, fg.get('dayEnd'));
      });

    return fg;
  }

  private addPracticeAvailabilityControls(practice?: PracticeAvailabilityServer): void {
    const fg = this.addRoomForm.get('practiceAvailability') as FormGroup;
    const weekday = this.formValues.selectedWeekday;

    if (weekday === Weekday.ALL) {
      getNumberArray(6).forEach((day) => {
        const fa = fg.get(day.toString()) as FormArray;
        if (!fa || !fa.length) {
          fg.addControl(day.toString(), this.fb.array([this.getPracticeAvailabilityFormGroup(day)]));
        }
      });

      const fa = fg.get('0') as FormArray;
      if (!fa || !fa.length) {
        fg.addControl('0'.toString(), this.fb.array([this.getPracticeAvailabilityFormGroup(0)]));
      }
    } else {
      const keys = Object.keys(fg.value);

      if (!keys?.length || (keys.length && !fg.get(this.formValues.selectedWeekday.toString()))) {
        fg.addControl(
          this.formValues.selectedWeekday.toString(),
          this.fb.array([this.getPracticeAvailabilityFormGroup(practice?.weekday, practice?.dayStart, practice?.dayEnd)]),
        );
      } else if (fg.get(this.formValues.selectedWeekday.toString()) && practice) {
        (fg.get(practice.weekday.toString()) as FormArray).push(
          this.getPracticeAvailabilityFormGroup(practice.weekday, practice.dayStart, practice.dayEnd),
        );
      }
    }
  }

  public practiceAvailabilityWeekWiseControlsArray(all = false, column: 1 | 2 | 0 = 0): FormArray[] {
    const controls: FormArray[] = [];

    const fg = this.addRoomForm.get('practiceAvailability');
    const { selectedWeekday } = this.formValues;

    let keys = [1, 2, 3, 4, 5, 6, 0];

    if (!all) {
      if (selectedWeekday === Weekday.ALL) {
        switch (column) {
          case 1:
            keys = [1, 2, 3, 4];
            break;
          case 2:
            keys = [5, 6, 0];
            break;
          default:
        }
      } else {
        keys = [selectedWeekday];
      }
    }

    if (keys?.length) {
      keys.forEach((key) => {
        const fa = fg?.get(key.toString()) as FormArray;
        if (fa?.length) {
          controls.push(fg?.get(key.toString()) as FormArray);
        }
      });
    }

    return controls;
  }

  public getFormArrayName(controlArray: FormArray): Weekday {
    return controlArray.value[0].weekday;
  }

  public selectWeekday(selectedWeekday: Weekday): void {
    if (this.formValues.selectedWeekday === selectedWeekday) {
      return;
    }

    // const { weekday } = this.formValues;
    this.addRoomForm.patchValue({ selectedWeekday });
    this.addPracticeAvailabilityControls();
  }

  public addSlot(controlArray: FormArray) {
    if (controlArray.controls.every((control) => control.value.dayStart && control.value.dayEnd)) {
      controlArray.push(this.getPracticeAvailabilityFormGroup(this.getFormArrayName(controlArray)));
    } else {
      this.notificationSvc.showNotification('Please fill current slot before adding new', NotificationType.WARNING);
    }
  }

  public removeSlot(controlArray: FormArray, i: number) {
    controlArray.removeAt(i);

    const formArrays = this.practiceAvailabilityWeekWiseControlsArray(true);
    this.handleSlotExistsError(formArrays);
  }

  public closeModal(res: boolean) {
    this.modalSvc.close(res);
    // this.ngOnDestroy();
  }

  public handle(e: Event) {
    console.log(e);
  }

  public saveRoom() {
    const requiredKeys: string[] = ['name', 'type'];
    let valid = true;

    requiredKeys.forEach((key) => {
      if (this.addRoomForm.get(key)?.invalid) {
        this.addRoomForm.get(key)?.markAsTouched();
        if (valid) {
          valid = false;
        }
      }
    });

    const controlArrays: FormArray[] = this.practiceAvailabilityWeekWiseControlsArray(true);

    if (valid) {
      valid = !this.isPracticeFormInvalid(controlArrays);
    }

    if (!valid) {
      this.notificationSvc.showNotification('Form is not valid.', NotificationType.WARNING);
      return;
    }

    this.submitting$$.next(true);

    const { practiceAvailabilityToggle, practiceAvailability, selectedWeekday, placeInAgendaIndex, ...rest } = this.formValues;
    const addRoomReqData: AddRoomRequestData = {
      ...rest,
      availabilityType: +this.formValues.practiceAvailabilityToggle,
      practiceAvailability: this.formValues.practiceAvailabilityToggle
        ? [
            ...controlArrays.reduce(
              (acc, formArray) => [
                ...acc,
                ...formArray.controls.reduce((a, control) => {
                  if (control.value.dayStart && control.value.dayEnd) {
                    return [
                      ...a,
                      {
                        weekday: control.value.weekday,
                        dayStart: control.value.dayStart,
                        dayEnd: control.value.dayEnd,
                      },
                    ];
                  }
                  return a;
                }, [] as PracticeAvailability[]),
              ],
              [] as PracticeAvailability[],
            ),
          ]
        : [],
    };

    if (!addRoomReqData.practiceAvailability) {
      addRoomReqData.practiceAvailability = [];
    }

    if (this.modalData?.roomID) {
      addRoomReqData.id = this.modalData.roomID;
    }

    console.log(addRoomReqData);

    if (this.modalData.edit) {
      this.roomApiSvc
        .editRoom$(addRoomReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(
          () => {
            this.notificationSvc.showNotification(`Room ${this.modalData.edit ? 'updated' : 'added'} successfully`);
            this.closeModal(true);
            this.submitting$$.next(false);
          },
          () => this.submitting$$.next(false),
        );
    } else {
      this.roomApiSvc
        .addRoom$(addRoomReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(
          () => {
            this.notificationSvc.showNotification(`Room ${this.modalData.edit ? 'updated' : 'added'} successfully`);
            this.closeModal(true);
            this.submitting$$.next(false);
          },
          () => this.submitting$$.next(false),
        );
    }
  }

  private isPracticeFormInvalid(controlArrays: FormArray[]): boolean {
    if (!this.formValues.practiceAvailabilityToggle) {
      return false;
    }

    for (let i = 0; i < controlArrays.length; i++) {
      for (let j = 0; j < controlArrays[i].length; j++) {
        if (controlArrays[i].controls[j].get('dayStart')?.errors || controlArrays[i].controls[j].get('dayEnd')?.errors) {
          return true;
        }
      }
    }

    return false;
  }

  public getBadgeColor(weekday: Weekday): BadgeColor {
    if (this.formValues.selectedWeekday === weekday) {
      return 'secondary';
    }

    if (weekday === Weekday.ALL) {
      for (let i = 0; i < 7; i++) {
        if (!this.formValues.practiceAvailability[i.toString()]?.every((pa) => pa?.dayEnd && pa?.dayStart)) {
          return 'primary';
        }
      }

      return 'gray';
    }

    const practiceHours = this.formValues.practiceAvailability[weekday.toString()];
    if (practiceHours?.length && practiceHours.every((pa) => pa.dayEnd && pa.dayStart)) {
      return 'gray';
    }

    return 'primary';
  }

  public handleTimeInput(time: string, control: AbstractControl | null | undefined, timingValueControl: AbstractControl | null | undefined) {
    this.searchTime(time, timingValueControl);
    this.formatTime(time, control, timingValueControl);
  }

  public handleTimeFocusOut(time: string, control: AbstractControl | null | undefined) {
    this.handleError(time, control);
  }

  private searchTime(time: string, timingValueControl: AbstractControl | null | undefined) {
    if (!time) {
      return;
    }

    timingValueControl?.setValue([...this.timings.filter((timing) => timing.value.includes(time))]);
  }

  private handleError(time: string, control: AbstractControl | null | undefined) {
    //  Handling invalid time input
    this.handleInvalidTimeError(time, control);

    // Handling slot errors
    const controlArrays = this.practiceAvailabilityWeekWiseControlsArray(true);

    this.handleInvalidSlotRangeError(controlArrays);
    this.handleSlotExistsError(controlArrays);
  }

  private handleInvalidTimeError(time: string, control: AbstractControl | null | undefined) {
    if (!time) {
      toggleControlError(control, this.invalidTimeError, false);
      return;
    }

    if (!time.match(TIME_24)) {
      toggleControlError(control, this.invalidTimeError);
      return;
    }

    toggleControlError(control, this.invalidTimeError, false);
  }

  private handleInvalidSlotRangeError(controlArrays: FormArray[]) {
    for (let i = 0; i < controlArrays.length; i++) {
      for (let j = 0; j < controlArrays[i].length; j++) {
        const dayStart = controlArrays[i].controls[j].get('dayStart');
        const dayEnd = controlArrays[i].controls[j].get('dayEnd');

        if (dayStart?.value && dayEnd?.value) {
          if (timeToNumber(dayStart.value) >= timeToNumber(dayEnd?.value)) {
            toggleControlError(dayStart, this.invalidSlotRangeError);
            toggleControlError(dayEnd, this.invalidSlotRangeError);
            return;
          }
        }

        toggleControlError(dayStart, this.invalidSlotRangeError, false);
        toggleControlError(dayEnd, this.invalidSlotRangeError, false);
      }
    }
  }

  private handleSlotExistsError(controlArrays: FormArray[]) {
    console.log(controlArrays);
    controlArrays.forEach((formArray) => {
      const { controls } = formArray;
      if (formArray.length > 1 && controls[1].value.dayStart && controls[1].value.dayEnd) {
        const sortedControls = [...controls].sort((a, b) => timeToNumber(a.value.daysStart) - timeToNumber(b.value.dayStart));

        const first = sortedControls[0];

        for (let j = 1; j < formArray.length; j++) {
          const curr = sortedControls[j];

          if (curr.value.dayStart && curr.value.dayEnd) {
            if (checkTimeRangeOverlapping(first.value.dayStart, first.value.dayEnd, curr.value.dayStart, curr.value.dayEnd)) {
              toggleControlError(curr.get('dayStart'), this.slotExistsError);
              toggleControlError(curr.get('dayEnd'), this.slotExistsError);
              toggleControlError(first.get('dayStart'), this.slotExistsError);
              toggleControlError(first.get('dayEnd'), this.slotExistsError);
            } else {
              toggleControlError(curr.get('dayStart'), this.slotExistsError, false);
              toggleControlError(curr.get('dayEnd'), this.slotExistsError, false);
              toggleControlError(first.get('dayStart'), this.slotExistsError, false);
              toggleControlError(first.get('dayEnd'), this.slotExistsError, false);
            }
          }
        }
      } else if (formArray.length === 1) {
        toggleControlError(controls[0].get('dayStart'), this.slotExistsError, false);
        toggleControlError(controls[0].get('dayEnd'), this.slotExistsError, false);
      }
    });
  }

  private formatTime(time: string, control: AbstractControl | null | undefined, timingValueControl: AbstractControl | null | undefined) {
    // debugger;
    const formattedTime = formatTime(time, 24, 5);

    if (!formattedTime) {
      return;
    }

    const nameValue = {
      name: formattedTime,
      value: formattedTime,
    };

    if (!timingValueControl?.value?.find((t) => t?.value === formattedTime)) {
      timingValueControl?.setValue(timingValueControl?.value?.splice(0, 0, nameValue));
    }

    control?.setValue(formattedTime);
  }
}
