import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { BadgeColor, NotificationType } from 'diflexmo-angular-design';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, of, switchMap, take, takeUntil } from 'rxjs';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { stringToTimeArray, Weekday } from '../../../../shared/models/calendar.model';
import { UserApiService } from '../../../../core/services/user-api.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { COMING_FROM_ROUTE, EDIT, EXAM_ID } from '../../../../shared/utils/const';
import { PracticeAvailability, PracticeAvailabilityServer } from '../../../../shared/models/practice.model';
import { StaffsGroupedByType } from '../../../../shared/models/staff.model';
import { Room, RoomsGroupedByType, RoomType } from '../../../../shared/models/rooms.model';
import { CreateExamRequestData, Exam } from '../../../../shared/models/exam.model';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { UserType } from '../../../../shared/models/user.model';

interface TimeDistributed {
  hour: number;
  minute: number;
  second?: number;
}

interface FormValues {
  name: string;
  expensive: number;
  roomType: RoomType;
  roomsForExam: {
    roomId: number;
    duration: number;
    roomName: string;
    selectRoom: boolean;
  }[];
  info: string;
  uncombinables: number[];
  mandatoryStaffs: number[];
  assistantCount: number;
  assistants: number[];
  radiologistCount: number;
  radiologists: number[];
  nursingCount: number;
  nursing: number[];
  secretaryCount: number;
  secretaries: number[];
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
  selector: 'dfm-add-exam',
  templateUrl: './add-exam.component.html',
  styleUrls: ['./add-exam.component.scss'],
})
export class AddExamComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public createExamForm!: FormGroup;

  public examDetails$$ = new BehaviorSubject<Exam | undefined>(undefined);

  public staffsGroupedByTypes$$ = new BehaviorSubject<StaffsGroupedByType>({
    assistants: [],
    radiologists: [],
    nursing: [],
    secretaries: [],
    mandatory: [],
  });

  public availableRooms$$ = new BehaviorSubject<RoomsGroupedByType>({ private: [], public: [] });

  public loading$$ = new BehaviorSubject(false);

  public exams: any[] = [];

  public roomTypes: any[] = [];

  public weekdayEnum = Weekday;

  public comingFromRoute = '';

  public edit = false;

  public formErrors = {
    selectRoomErr: false,
    expensiveErr: false,
  };

  public count: any[] = [
    {
      value: '1',
      name: '1',
    },
    {
      value: '2',
      name: '2',
    },
    {
      value: '3',
      name: '3',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private userApiSvc: UserApiService,
    private examApiSvc: ExamApiService,
    private staffApiSvc: StaffApiService,
    private roomApiSvc: RoomsApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private routerStateSvc: RouterStateService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
    const state = this.router.getCurrentNavigation()?.extras?.state;
    if (state !== undefined) {
      this.loading$$.next(true);
      this.comingFromRoute = state[COMING_FROM_ROUTE];
      this.edit = state[EDIT];

      localStorage.setItem(COMING_FROM_ROUTE, this.comingFromRoute);
      if (typeof this.edit === 'boolean') {
        localStorage.setItem(EDIT, this.edit.toString());
      }
    } else {
      this.loading$$.next(true);
      this.getStateFromLocalStorage();
    }
  }

  private getStateFromLocalStorage() {
    const comingFromRoute = localStorage.getItem(COMING_FROM_ROUTE);
    if (comingFromRoute) {
      this.comingFromRoute = comingFromRoute;
    }
    const edit = localStorage.getItem(EDIT);
    if (edit) {
      this.edit = edit === 'true';
    }
  }

  public ngOnInit(): void {
    this.routerStateSvc
      .listenForParamChange$(EXAM_ID)
      .pipe(
        switchMap((examID) => {
          if (examID) {
            return this.examApiSvc.getExamByID(+examID);
          }
          return of({} as Exam);
        }),
      )
      .subscribe((examDetails) => {
        this.createForm(examDetails);
        this.loading$$.next(false);
        this.examDetails$$.next(examDetails);
      });

    this.examApiSvc.exams$.pipe(takeUntil(this.destroy$$)).subscribe((exams) => {
      this.exams = exams.map(({ id, name }) => ({ name, value: id }));
    });

    this.roomApiSvc
      .getRoomTypes()
      .pipe(take(1))
      .subscribe((roomTypes) => (this.roomTypes = [...roomTypes]));

    this.roomApiSvc.roomsGroupedByType$.pipe(takeUntil(this.destroy$$)).subscribe((rooms) => {
      this.availableRooms$$.next(rooms);
    });

    this.staffApiSvc.staffList$.pipe(takeUntil(this.destroy$$)).subscribe((staffs) => {
      console.log('staffs: ', staffs);
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
          case UserType.Assistant:
            staffGroupedByType.assistants.push(nameValue);
            break;
          case UserType.Radiologist:
            staffGroupedByType.radiologists.push(nameValue);
            break;
          case UserType.Scheduler:
          case UserType.Secretary:
            staffGroupedByType.secretaries.push(nameValue);
            break;
          case UserType.Nursing:
            staffGroupedByType.nursing.push(nameValue);
            break;
          default:
        }
      });

      this.staffsGroupedByTypes$$.next({ ...staffGroupedByType });
    });

    this.createExamForm
      ?.get('roomType')
      ?.valueChanges.pipe(takeUntil(this.destroy$$))
      .subscribe((roomType) => {
        this.createRoomsForExamFormArray(roomType);
      });

    this.createExamForm
      ?.get('expensive')
      ?.valueChanges.pipe(
        filter((value) => !!value),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => this.toggleExpensiveError(+value));

    this.createExamForm
      ?.get('practiceAvailabilityToggle')
      ?.valueChanges.pipe(
        filter((value: boolean) => value),
        distinctUntilChanged(),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => this.addPracticeAvailabilityControls());
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
    localStorage.removeItem(COMING_FROM_ROUTE);
    localStorage.removeItem(EDIT);
  }

  private createForm(examDetails?: Exam | undefined): void {
    console.log('examDetails', examDetails);
    this.createExamForm = this.fb.group({
      name: [examDetails?.name, [Validators.required]],
      expensive: [examDetails?.expensive, [Validators.required, Validators.min(1)]],
      roomType: [null, [Validators.required]],
      roomsForExam: this.fb.array([]),
      info: [examDetails?.info, []],
      uncombinables: [examDetails?.uncombinables, []],
      mandatoryStaffs: [[], []],
      assistantCount: [examDetails?.assistantCount, []],
      assistants: [[], []],
      radiologistCount: [examDetails?.assistantCount, []],
      radiologists: [[], []],
      nursingCount: [examDetails?.nursingCount, []],
      nursing: [[], []],
      secretaryCount: [examDetails?.secretaryCount, []],
      secretaries: [[], []],
      selectedWeekday: [this.weekdayEnum.ALL, []],
      practiceAvailabilityToggle: [!!examDetails?.practiceAvailability?.length, []],
      practiceAvailability: this.fb.group({}),
    });

    if (examDetails?.practiceAvailability?.length) {
      examDetails.practiceAvailability.forEach((practice) => {
        this.createExamForm.patchValue({ selectedWeekday: practice.weekday });
        this.addPracticeAvailabilityControls(practice);
      });
    }

    if (examDetails?.roomsForExam?.length) {
      this.roomApiSvc
        .getRoomByID(examDetails.roomsForExam[0].roomId)
        .pipe(takeUntil(this.destroy$$))
        .subscribe((room) => {
          this.createExamForm.patchValue({ roomType: room?.type }, { emitEvent: true });
        });
    }
  }

  private getRoomsForExamFormGroup(room: Room): FormGroup {
    const fg = this.fb.group({
      roomId: [room.id, []],
      duration: [{ value: null, disabled: true }, [Validators.required, Validators.min(1)]],
      roomName: [room.name, []],
      selectRoom: [false, []],
    });

    fg.get('selectRoom')
      ?.valueChanges.pipe(takeUntil(this.destroy$$))
      .subscribe((value) => {
        if (value) {
          fg.get('duration')?.enable();
          this.formErrors.selectRoomErr = false;
        } else {
          fg.get('duration')?.disable();
        }
      });

    fg.get('duration')
      ?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe(() => this.toggleExpensiveError(+this.formValues.expensive));

    return fg;
  }

  private createRoomsForExamFormArray(roomType: RoomType) {
    const fa = this.createExamForm.get('roomsForExam') as FormArray;

    fa.clear();

    console.log('in', this.availableRooms$$.value);
    if (this.availableRooms$$.value[roomType]?.length) {
      console.log('in');
      this.availableRooms$$.value[roomType].forEach((room) => fa.push(this.getRoomsForExamFormGroup(room)));
    }

    this.cdr.detectChanges();
  }

  public get roomsForExamControls(): AbstractControl[] {
    return (this.createExamForm.get('roomsForExam') as FormArray)?.controls;
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

  private toggleExpensiveError(expensive: number) {
    let totalRoomExpensive = 0;
    let validInput = false;
    this.formValues.roomsForExam.forEach((room) => {
      if (room.selectRoom && +room.duration) {
        totalRoomExpensive += +room.duration;
        validInput = true;
      }
    });

    if (!validInput) {
      return;
    }

    console.log(totalRoomExpensive, expensive);

    this.formErrors.expensiveErr = totalRoomExpensive !== expensive;
  }

  // private toggleTimeError(dayStart: AbstractControl | null, dayEnd: AbstractControl | null) {
  //   if (!dayStart && !dayEnd) {
  //     return;
  //   }
  //
  //   if (
  //     dayStart?.value?.hour > dayEnd?.value?.hour ||
  //     (dayStart?.value?.hour === dayEnd?.value?.hour && dayStart?.value?.minute > dayEnd?.value?.minute)
  //   ) {
  //     dayStart?.setErrors({ startTimeErr: true });
  //     dayEnd?.setErrors({ endTimeErr: true });
  //   } else {
  //     if (dayStart?.hasError('startTimeErr')) {
  //       dayStart?.setErrors(null);
  //     }
  //
  //     if (dayEnd?.hasError('endTimeErr')) {
  //       dayEnd?.setErrors(null);
  //     }
  //   }
  // }

  private addPracticeAvailabilityControls(practice?: PracticeAvailabilityServer): void {
    const fg = this.createExamForm.get('practiceAvailability') as FormGroup;
    const weekday = this.formValues.selectedWeekday;
    console.log('practice 403', practice);
    console.log('weekday', weekday);
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

    const fg = this.createExamForm.get('practiceAvailability');
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

  public get formValues(): FormValues {
    return this.createExamForm.value;
  }

  public getFormArrayName(controlArray: FormArray): Weekday {
    return controlArray.value[0].weekday;
  }

  public handleRadioButtonChange(toggle: boolean): void {
    //  set practice availability toggle
    this.createExamForm.patchValue({ practiceAvailabilityToggle: toggle });
  }

  public selectWeekday(selectedWeekday: Weekday): void {
    if (this.formValues.selectedWeekday === selectedWeekday) {
      return;
    }

    // const { weekday } = this.formValues;
    this.createExamForm.patchValue({ selectedWeekday });
    this.addPracticeAvailabilityControls();
  }

  public addSlot(controlArray: FormArray) {
    controlArray.push(this.getPracticeAvailabilityFormGroup(this.getFormArrayName(controlArray)));
  }

  public removeSlot(controlArray: FormArray, i: number) {
    controlArray.removeAt(i);
  }

  public saveExam(): void {
    if (this.createExamForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.createExamForm.updateValueAndValidity();
      return;
    }

    if (this.formValues.roomsForExam?.every((room) => !room.selectRoom)) {
      this.formErrors.selectRoomErr = true;
      this.notificationSvc.showNotification('Form is not valid', NotificationType.WARNING);
      return;
    }

    if (this.formErrors.expensiveErr) {
      this.notificationSvc.showNotification('Form is not valid', NotificationType.WARNING);
    }

    const createExamRequestData: CreateExamRequestData = {
      name: this.formValues.name,
      expensive: this.formValues.expensive,
      info: this.formValues.info,
      assistantCount: +this.formValues.assistantCount ?? 0,
      nursingCount: +this.formValues.nursingCount ?? 0,
      radiologistCount: +this.formValues.radiologistCount ?? 0,
      secretaryCount: +this.formValues.secretaryCount ?? 0,
      usersList: [
        ...(this.formValues.assistants ?? []),
        ...(this.formValues.nursing ?? []),
        ...(this.formValues.radiologists ?? []),
        ...(this.formValues.secretaries ?? []),
        ...(this.formValues.mandatoryStaffs ?? []),
      ],
      roomsForExam: [
        ...this.formValues.roomsForExam
          .filter((room) => room.selectRoom)
          .map(({ roomId, duration }) => ({
            roomId,
            duration,
          })),
      ],
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

    if (this.examDetails$$.value?.id) {
      createExamRequestData.id = this.examDetails$$.value?.id;
    }

    console.log(createExamRequestData);
    if (this.edit) {
      this.examApiSvc
        .updateExam$(createExamRequestData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(() => {
          this.notificationSvc.showNotification(`Exam added successfully`);
          let route: string;
          if (this.comingFromRoute === 'view') {
            route = '../view';
          } else {
            route = this.edit ? '/exam' : '../';
          }

          console.log(route);
          this.router.navigate([route], { relativeTo: this.route });
        });
    } else {
      this.examApiSvc
        .createExam$(createExamRequestData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(() => {
          this.notificationSvc.showNotification(`Exam updated successfully`);
          let route: string;
          if (this.comingFromRoute === 'view') {
            route = '../view';
          } else {
            route = this.edit ? '/exam' : '../';
          }

          console.log(route);
          this.router.navigate([route], { relativeTo: this.route });
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

  // handleClick(uncombinableDropdown: InputDropdownComponent) {
  //   console.log(uncombinableDropdown as any);
  //
  //
  //   setTimeout(() => {
  //     if (!(uncombinableDropdown as any).isDropdownClosed) {
  //       uncombinableDropdown.clickout();
  //     }
  //   }, 500);
  // }
}
