import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, of, switchMap, take, takeUntil } from 'rxjs';
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
import { formatTime } from '../../../../shared/utils/formatTime';
import { Status } from '../../../../shared/models/status.model';

interface FormValues {
  name: string;
  description: string;
  type: RoomType;
  placeInAgenda: number;
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

  public modalData!: { edit: boolean; roomID: number };

  public weekdayEnum = Weekday;

  private timings: NameValue[] = [];

  public filteredTimings: NameValue[] = [];

  public readonly interval: number = 5;

  constructor(
    private modalSvc: ModalService,
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private roomApiSvc: RoomsApiService,
    private nameValuePipe: NameValuePairPipe,
    private timeInIntervalPipe: TimeInIntervalPipe,
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
      placeInAgenda: [{ value: roomDetails?.placeInAgenda, disabled: true }, [Validators.required]],
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
    }
  }

  private getPracticeAvailabilityFormGroup(weekday?: Weekday, dayStart?: string, dayEnd?: string): FormGroup {
    let start = '';
    if (dayStart) {
      const s = +dayStart.slice(0, 2);
      if (dayStart.toLowerCase().includes('pm')) {
        if (s < 12) {
          start = `${s + 12}:${dayStart.slice(3, 5)}`;
        } else {
          start = `${s}:${dayStart.slice(3, 5)}`;
        }
      } else if (dayStart.toLowerCase().includes('am')) {
        if (s === 12) {
          start = `00:${dayStart.slice(3, 5)}`;
        } else {
          start = dayStart.slice(0, 5);
        }
      }
    }

    let end = '';
    if (dayEnd) {
      const e = +dayEnd.slice(0, 2);
      if (dayEnd.toLowerCase().includes('pm')) {
        if (e < 12) {
          end = `${e + 12}:${dayEnd.slice(3, 5)}`;
        } else {
          end = `${e}:${dayEnd.slice(3, 5)}`;
        }
      } else if (dayEnd.toLowerCase().includes('am')) {
        if (e === 12) {
          end = `00:${dayEnd.slice(3, 5)}`;
        } else {
          end = dayEnd.slice(0, 5);
        }
      }
    }

    console.log(dayStart, dayEnd, start, end);

    const fg = this.fb.group({
      weekday: [weekday ?? this.formValues.selectedWeekday, []],
      dayStart: [start, []],
      dayEnd: [end, []],
      startTimings: [this.filteredTimings, []],
      endTimings: [this.filteredTimings, []],
    });

    fg.get('dayStart')
      ?.valueChanges.pipe(
        filter((time) => !!time),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => {
        // this.toggleTimeError(fg.get('dayStart'), fg.get('dayEnd'));
      });

    fg.get('dayEnd')
      ?.valueChanges.pipe(
        filter((time) => !!time),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => {
        // this.toggleTimeError(fg.get('dayStart'), fg.get('dayEnd'));
      });

    return fg;
  }

  private addPracticeAvailabilityControls(practice?: PracticeAvailabilityServer): void {
    console.log('in');
    const fg = this.addRoomForm.get('practiceAvailability') as FormGroup;
    const weekday = this.formValues.selectedWeekday;
    switch (weekday) {
      case Weekday.ALL:
        Object.values(this.weekdayEnum).forEach((day) => {
          if (typeof day === 'number' && day < 7) {
            const fa = fg.get(day.toString()) as FormArray;
            if (!fa || !fa.length) {
              fg.addControl(day.toString(), this.fb.array([this.getPracticeAvailabilityFormGroup(day)]));
            }
          }
        });
        break;
      default:
        if (!Object.keys(fg.value)?.length || (Object.keys(fg.value).length && !fg.get(this.formValues.selectedWeekday.toString()))) {
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
          default:
            keys = [5, 6, 0];
            break;
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
    controlArray.push(this.getPracticeAvailabilityFormGroup(this.getFormArrayName(controlArray)));
  }

  public removeSlot(controlArray: FormArray, i: number) {
    controlArray.removeAt(i);
  }

  public closeModal(res: boolean) {
    this.modalSvc.close(res);
    this.ngOnDestroy();
  }

  public handle(e: Event) {
    console.log(e);
  }

  public saveRoom() {
    if (this.addRoomForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.addRoomForm.updateValueAndValidity();
      return;
    }

    this.submitting$$.next(true);

    const { practiceAvailabilityToggle, practiceAvailability, selectedWeekday, ...rest } = this.formValues;
    const addRoomReqData: AddRoomRequestData = {
      ...rest,
      availabilityType: +this.formValues.practiceAvailabilityToggle,
      placeInAgenda: this.addRoomForm.get('placeInAgenda')?.value,
      practiceAvailability: [
        ...this.practiceAvailabilityWeekWiseControlsArray(true).reduce(
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
      ],
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

  public getBadgeColor(weekday: Weekday): BadgeColor {
    if (this.formValues.selectedWeekday === weekday) {
      return 'primary';
    }

    if (weekday === Weekday.ALL) {
      for (let i = 0; i < 7; i++) {
        if (!this.formValues.practiceAvailability[i.toString()]?.every((pa) => pa?.dayEnd && pa?.dayStart)) {
          return 'gray';
        }
      }

      return 'success';
    }

    const practiceHours = this.formValues.practiceAvailability[weekday.toString()];
    if (practiceHours?.length && practiceHours.every((pa) => pa.dayEnd && pa.dayStart)) {
      return 'success';
    }

    return 'gray';
  }

  public handleTimeInput(time: string, control: AbstractControl | null | undefined, timingValueControl: AbstractControl | null | undefined) {
    this.searchInput(time, timingValueControl);

    const formattedTime = formatTime(time, 24, 5);

    if (!formattedTime) {
      return;
    }

    const nameValue = {
      name: formattedTime,
      value: formattedTime,
    };

    if (!this.filteredTimings.find((t) => t.value === formattedTime)) {
      this.filteredTimings.splice(0, 0, nameValue);
    }

    control?.setValue(formattedTime, { emitEvent: false });
  }

  private searchInput(time: string, timingValueControl: AbstractControl | null | undefined) {
    if (time.toString()) {
      timingValueControl?.setValue([...this.timings.filter((timing) => timing.value.includes(time))]);
    } else {
      timingValueControl?.setValue([...this.timings]);
    }
  }
}
