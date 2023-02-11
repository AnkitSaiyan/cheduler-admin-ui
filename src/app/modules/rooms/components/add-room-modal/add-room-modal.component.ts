import { Component, OnDestroy, OnInit } from '@angular/core';
import { distinctUntilChanged, filter, take, takeUntil } from 'rxjs';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BadgeColor, NotificationType } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ModalService } from '../../../../core/services/modal.service';
import { PracticeAvailability, PracticeAvailabilityServer } from '../../../../shared/models/practice.model';
import { stringToTimeArray, Weekday } from '../../../../shared/models/calendar.model';
import { AddRoomRequestData, Room, RoomType } from '../../../../shared/models/rooms.model';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';

interface TimeDistributed {
  hour: number;
  minute: number;
  second?: number;
}

interface FormValues {
  name: string;
  description: string;
  type: RoomType;
  roomNo: number;
  practiceAvailabilityToggle?: boolean;
  practiceAvailability: {
    [key: string]: {
      weekday: Weekday;
      dayStart: TimeDistributed;
      dayEnd: TimeDistributed;
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

  public modalData!: { edit: boolean; roomDetails: Room };

  public weekdayEnum = Weekday;

  constructor(
    private modalSvc: ModalService,
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private roomApiSvc: RoomsApiService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.modalSvc.dialogData$.pipe(take(1)).subscribe((data) => {
      this.modalData = data;
      this.createForm(this.modalData?.roomDetails);
    });

    this.addRoomForm
      .get('practiceAvailabilityToggle')
      ?.valueChanges.pipe(
        filter((value: boolean) => value),
        distinctUntilChanged(),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => this.addPracticeAvailabilityControls());
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
      roomNo: [roomDetails?.roomNo ?? Math.floor(Math.random() * 10), [Validators.required]],
      description: [roomDetails?.description ?? '', [Validators.required]],
      type: [roomDetails?.type ?? null, [Validators.required]],
      selectedWeekday: [this.weekdayEnum.ALL, []],
      practiceAvailabilityToggle: [!!roomDetails?.practiceAvailability?.length, []],
      practiceAvailability: this.fb.group({}),
    });

    if (roomDetails?.practiceAvailability?.length) {
      roomDetails.practiceAvailability.forEach((practice) => {
        this.addRoomForm.patchValue({ selectedWeekday: practice.weekday });
        this.addPracticeAvailabilityControls(practice);
      });
    }
  }

  public toggleAvailabilityForm(toggle: boolean): void {
    //  set practice availability toggle
    this.addRoomForm.patchValue({ practiceAvailabilityToggle: toggle });
  }

  private getPracticeAvailabilityFormGroup(weekday?: Weekday, dayStart?: TimeDistributed, dayEnd?: TimeDistributed): FormGroup {
    const fg = this.fb.group({
      weekday: [weekday ?? this.formValues.selectedWeekday, []],
      dayStart: [dayStart, []],
      dayEnd: [dayEnd, []],
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
    const fg = this.addRoomForm.get('practiceAvailability') as FormGroup;
    const weekday = this.formValues.selectedWeekday;
    switch (weekday) {
      case Weekday.ALL:
        Object.values(this.weekdayEnum).forEach((day) => {
          if (typeof day === 'number' && day > 0) {
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
            this.fb.array([
              this.getPracticeAvailabilityFormGroup(
                practice?.weekday,
                {
                  hour: stringToTimeArray(practice?.dayStart)[0],
                  minute: stringToTimeArray(practice?.dayStart)[1],
                },
                {
                  hour: stringToTimeArray(practice?.dayEnd)[0],
                  minute: stringToTimeArray(practice?.dayEnd)[1],
                },
              ),
            ]),
          );
        } else if (fg.get(this.formValues.selectedWeekday.toString()) && practice) {
          (fg.get(practice.weekday.toString()) as FormArray).push(
            this.getPracticeAvailabilityFormGroup(
              practice.weekday,
              {
                hour: stringToTimeArray(practice.dayStart)[0],
                minute: stringToTimeArray(practice.dayStart)[1],
              },
              {
                hour: stringToTimeArray(practice?.dayEnd)[0],
                minute: stringToTimeArray(practice?.dayEnd)[1],
              },
            ),
          );
        }
    }
  }

  public practiceAvailabilityWeekWiseControlsArray(all = false): FormArray[] {
    const controls: FormArray[] = [];

    const fg = this.addRoomForm.get('practiceAvailability');
    const { selectedWeekday } = this.formValues;
    let keys = Object.keys(this.formValues.practiceAvailability);
    if (!all) {
      keys = [...keys.filter((key) => key === selectedWeekday.toString() || selectedWeekday === Weekday.ALL)];
    }

    if (keys?.length) {
      keys.forEach((key) => {
        const fa = fg?.get(key) as FormArray;
        if (fa?.length) {
          controls.push(fg?.get(key) as FormArray);
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

    console.log(this.formValues);

    const { practiceAvailabilityToggle, practiceAvailability, selectedWeekday, ...rest } = this.formValues;
    const addRoomReqData: AddRoomRequestData = {
      ...rest,
      practiceAvailability: [
        ...this.practiceAvailabilityWeekWiseControlsArray(true).reduce(
          (acc, formArray) => [
            ...acc,
            ...formArray.controls.reduce((a, control) => {
              if (control.value.dayStart && control.value.dayEnd) {
                return [
                  ...a,
                  {
                    ...control.value,
                    dayStart: `${control.value.dayStart.hour}:${control.value.dayStart.minute}`,
                    dayEnd: `${control.value.dayEnd.hour}:${control.value.dayEnd.minute}`,
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

    if (this.modalData?.roomDetails?.id) {
      addRoomReqData.id = this.modalData.roomDetails.id;
    }

    console.log(addRoomReqData);
    if (this.modalData.edit) {
      this.roomApiSvc
      .editRoom$(addRoomReqData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification(`Room ${this.modalData.edit ? 'updated' : 'added'} successfully`);
        this.closeModal(true);
      }); 
    }else{
      this.roomApiSvc
      .addRoom$(addRoomReqData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification(`Room ${this.modalData.edit ? 'updated' : 'added'} successfully`);
        this.closeModal(true);
      }); 
    }
   
  }

  public getBadgeColor(weekday: Weekday): BadgeColor {
    if (this.formValues.selectedWeekday === weekday) {
      return 'primary';
    }

    if (weekday === Weekday.ALL) {
      for (let i = 1; i <= 7; i++) {
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
}
