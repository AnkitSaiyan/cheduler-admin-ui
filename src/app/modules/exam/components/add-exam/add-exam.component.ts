import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { BadgeColor, InputDropdownComponent, NotificationType } from 'diflexmo-angular-design';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter, map, of, startWith, switchMap, take, takeUntil } from 'rxjs';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Weekday } from '../../../../shared/models/calendar.model';
import { UserApiService } from '../../../../core/services/user-api.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { COMING_FROM_ROUTE, EDIT, EXAM_ID, TIME_24 } from '../../../../shared/utils/const';
import { PracticeAvailability, PracticeAvailabilityServer } from '../../../../shared/models/practice.model';
import { Room, RoomsGroupedByType, RoomType } from '../../../../shared/models/rooms.model';
import { CreateExamRequestData, Exam } from '../../../../shared/models/exam.model';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { AvailabilityType, UserType } from '../../../../shared/models/user.model';
import { toggleControlError } from '../../../../shared/utils/toggleControlError';
import { checkTimeRangeOverlapping, formatTime, get24HourTimeString, timeToNumber } from '../../../../shared/utils/time';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { getNumberArray } from '../../../../shared/utils/getNumberArray';
import { Status } from '../../../../shared/models/status.model';

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
      dayStart: string;
      dayEnd: string;
      startTimings: NameValue[];
      endTimings: NameValue[];
    }[];
  };
  selectedWeekday: Weekday;
  status: Status;
}

@Component({
  selector: 'dfm-add-exam',
  templateUrl: './add-exam.component.html',
  styleUrls: ['./add-exam.component.scss'],
})
export class AddExamComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public examForm!: FormGroup;

  public examDetails$$ = new BehaviorSubject<Exam | undefined>(undefined);

  public availableRooms$$ = new BehaviorSubject<RoomsGroupedByType>({ private: [], public: [] });

  public loading$$ = new BehaviorSubject(false);

  public submitting$$ = new BehaviorSubject(false);

  public assistants$$ = new BehaviorSubject<NameValue[] | null>(null);

  public nursing$$ = new BehaviorSubject<NameValue[] | null>(null);

  public radiologists$$ = new BehaviorSubject<NameValue[] | null>(null);

  public secretaries$$ = new BehaviorSubject<NameValue[] | null>(null);

  public mandatoryStaffs$$ = new BehaviorSubject<NameValue[] | null>(null);

  public exams$$ = new BehaviorSubject<null | NameValue[]>(null);

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

  public timings: NameValue[] = [];

  public filteredTimings: NameValue[] = [];

  public readonly interval: number = 5;

  public readonly invalidTimeError: string = 'invalidTime';

  public readonly invalidSlotRangeError: string = 'invalidSlot';

  public readonly slotExistsError: string = 'slotExists';

  public examID!: string;

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
    private nameValuePipe: NameValuePairPipe,
    private timeInIntervalPipe: TimeInIntervalPipe,
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
    this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(this.interval))];
    this.filteredTimings = [...this.timings];

    this.routerStateSvc
      .listenForParamChange$(EXAM_ID)
      .pipe(
        switchMap((examID) => {
          if (examID) {
            this.examID = examID;
            return this.examApiSvc.getExamByID(+examID);
          }
          return of({} as Exam);
        }),
        take(1),
      )
      .subscribe((examDetails) => {
        this.createForm(examDetails);

        this.examForm.patchValue({
          uncombinables: examDetails?.uncombinables?.map((u) => u?.toString()),
        });

        this.loading$$.next(false);
        this.examDetails$$.next(examDetails);
      });

    this.examApiSvc.exams$
      .pipe(
        map((exams) => exams.filter((exam) => exam?.status && +exam.id !== (+this.examID ?? 0))),
        takeUntil(this.destroy$$),
      )
      .subscribe((exams) => {
        this.exams$$.next([...exams.map(({ id, name }) => ({ name, value: id?.toString() }))]);
        this.cdr.detectChanges();
      });

    this.staffApiSvc.staffList$
      .pipe(
        debounceTime(0),
        map((staffs) => staffs.filter((staff) => staff.status)),
        takeUntil(this.destroy$$),
      )
      .subscribe((staffs) => {
        const radiologists: NameValue[] = [];
        const assistants: NameValue[] = [];
        const nursing: NameValue[] = [];
        const secretaries: NameValue[] = [];
        const mandatory: NameValue[] = [];

        staffs.forEach((staff) => {
          const nameValue = { name: `${staff.firstname} ${staff.lastname}`, value: staff?.id?.toString() };

          mandatory.push({ ...nameValue });

          switch (staff.userType) {
            case UserType.Assistant:
              assistants.push({ ...nameValue });
              break;
            case UserType.Radiologist:
              radiologists.push({ ...nameValue });
              break;
            // case UserType.Scheduler:
            case UserType.Secretary:
              secretaries.push({ ...nameValue });
              break;
            case UserType.Nursing:
              nursing.push({ ...nameValue });
              break;
            default:
          }
        });

        this.radiologists$$.next([...radiologists]);
        this.assistants$$.next([...assistants]);
        this.nursing$$.next([...nursing]);
        this.secretaries$$.next([...secretaries]);
        this.mandatoryStaffs$$.next([...mandatory]);

        this.cdr.detectChanges();
      });

    this.roomApiSvc
      .getRoomTypes()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((roomTypes) => (this.roomTypes = [...roomTypes]));

    this.roomApiSvc.roomsGroupedByType$.pipe(takeUntil(this.destroy$$)).subscribe((rooms) => {
      this.availableRooms$$.next(rooms);
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
    localStorage.removeItem(COMING_FROM_ROUTE);
    localStorage.removeItem(EDIT);
  }

  private createForm(examDetails?: Exam | undefined): void {
    const assistants: string[] = [];
    const radiologists: string[] = [];
    const nursing: string[] = [];
    const secretaries: string[] = [];
    const mandatory: string[] = [];

    if (examDetails?.users?.length) {
      examDetails.users.forEach((u) => {
        if (u.isMandate) {
          mandatory.push(u.id.toString());
        } else {
          switch (u.userType) {
            case UserType.Assistant:
              assistants.push(u.id.toString());
              break;
            case UserType.Radiologist:
              radiologists.push(u.id.toString());
              break;
            case UserType.Nursing:
              nursing.push(u.id.toString());
              break;
            case UserType.Secretary:
              secretaries.push(u.id.toString());
              break;
            default:
          }
        }
      });
    }

    this.examForm = this.fb.group({
      name: [examDetails?.name, [Validators.required]],
      expensive: [examDetails?.expensive, [Validators.required, Validators.min(1)]],
      roomType: [null, [Validators.required]],
      roomsForExam: this.fb.array([]),
      info: [examDetails?.info, []],
      uncombinables: [[...(examDetails?.uncombinables?.map((u) => u?.toString()) || [])], []],
      mandatoryStaffs: [mandatory, []],
      assistantCount: [examDetails?.assistantCount?.toString() ?? '0', []],
      assistants: [assistants, []],
      radiologistCount: [examDetails?.radiologistCount?.toString() ?? '0', []],
      radiologists: [radiologists, []],
      nursingCount: [examDetails?.nursingCount?.toString() ?? '0', []],
      nursing: [nursing, []],
      secretaryCount: [examDetails?.secretaryCount?.toString() ?? '0', []],
      secretaries: [secretaries, []],
      selectedWeekday: [this.weekdayEnum.ALL, []],
      practiceAvailabilityToggle: [!!examDetails?.practiceAvailability?.length, []],
      status: [this.edit ? +!!examDetails?.status : Status.Active, []],
      practiceAvailability: this.fb.group({}),
    });

    this.cdr.detectChanges();

    if (examDetails?.practiceAvailability?.length) {
      const weekdays = new Set([0, 1, 2, 3, 4, 5, 6]);

      examDetails.practiceAvailability.forEach((practice) => {
        this.examForm.patchValue({ selectedWeekday: practice.weekday });
        this.addPracticeAvailabilityControls(practice);
        if (weekdays.has(practice.weekday)) {
          weekdays.delete(practice.weekday);
        }
      });

      weekdays.forEach((weekday) => {
        this.examForm.patchValue({ selectedWeekday: weekday });
        this.addPracticeAvailabilityControls();
      });

      this.examForm.patchValue({ selectedWeekday: Weekday.ALL });

      this.cdr.detectChanges();
    } else {
      this.addPracticeAvailabilityControls();
    }

    this.examForm
      .get('roomType')
      ?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe((roomType) => this.createRoomsForExamFormArray(roomType));

    if (examDetails?.roomsForExam?.length) {
      this.roomApiSvc
        .getRoomByID(examDetails.roomsForExam[0].roomId)
        .pipe(takeUntil(this.destroy$$))
        .subscribe((room) => this.examForm.get('roomType')?.setValue(room?.type));
    }

    this.examForm
      .get('roomType')
      ?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe((roomType) => this.createRoomsForExamFormArray(roomType));

    this.examForm
      .get('expensive')
      ?.valueChanges.pipe(
        debounceTime(0),
        filter((value) => !!value),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => this.toggleExpensiveError(+value));

    this.examForm
      .get('practiceAvailabilityToggle')
      ?.valueChanges.pipe(
        filter((value: boolean) => value),
        distinctUntilChanged(),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => this.addPracticeAvailabilityControls());

    combineLatest([this.examForm?.get('assistants')?.valueChanges?.pipe(startWith('')), this.examForm?.get('assistantCount')?.valueChanges])
      .pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe(() => {
        this.checkStaffCountValidity(this.examForm.get('assistants'), this.examForm.get('assistantCount'), 'assistantCount');
      });

    combineLatest([this.examForm?.get('radiologists')?.valueChanges?.pipe(startWith('')), this.examForm?.get('radiologistCount')?.valueChanges])
      .pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe(() => {
        this.checkStaffCountValidity(this.examForm.get('radiologists'), this.examForm.get('radiologistCount'), 'radiologistCount');
      });

    combineLatest([this.examForm?.get('nursing')?.valueChanges?.pipe(startWith('')), this.examForm?.get('nursingCount')?.valueChanges])
      .pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe(() => {
        this.checkStaffCountValidity(this.examForm.get('nursing'), this.examForm.get('nursingCount'), 'nursingCount');
      });

    combineLatest([this.examForm?.get('secretaries')?.valueChanges?.pipe(startWith('')), this.examForm?.get('secretaryCount')?.valueChanges])
      .pipe(debounceTime(0), takeUntil(this.destroy$$))
      .subscribe(() => {
        this.checkStaffCountValidity(this.examForm.get('secretaries'), this.examForm.get('secretaryCount'), 'secretaryCount');
      });
  }

  private getRoomsForExamFormGroup(room: Room): FormGroup {
    let roomForExam;

    if (this.examDetails$$.value?.roomsForExam?.length) {
      roomForExam = this.examDetails$$.value?.roomsForExam.find((examRoom) => examRoom?.roomId?.toString() === room?.id?.toString());
    }

    const fg = this.fb.group({
      roomId: [room.id, []],
      duration: [
        {
          value: roomForExam?.duration ?? null,
          disabled: !roomForExam?.duration,
        },
        [Validators.required, Validators.min(1)],
      ],
      roomName: [room.name, []],
      selectRoom: [!!roomForExam?.duration, []],
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
    const fa = this.examForm.get('roomsForExam') as FormArray;

    fa.clear();

    if (this.availableRooms$$.value[roomType]?.length) {
      this.availableRooms$$.value[roomType].forEach((room) => fa.push(this.getRoomsForExamFormGroup(room)));
    }

    this.cdr.detectChanges();
  }

  public get roomsForExamControls(): AbstractControl[] {
    return (this.examForm.get('roomsForExam') as FormArray)?.controls;
  }

  private getPracticeAvailabilityFormGroup(weekday?: Weekday, dayStart?: string, dayEnd?: string): FormGroup {
    const fg = this.fb.group({
      weekday: [weekday ?? this.formValues.selectedWeekday, []],
      dayStart: [get24HourTimeString(dayStart), []],
      dayEnd: [get24HourTimeString(dayEnd), []],
      startTimings: [[...this.filteredTimings], []],
      endTimings: [[...this.filteredTimings], []],
    });

    fg.get('dayStart')
      ?.valueChanges.pipe(
        filter((time) => !!time),
        debounceTime(0),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => this.handleError(value as string, fg.get('dayStart')));

    fg.get('dayEnd')
      ?.valueChanges.pipe(
        filter((time) => !!time),
        debounceTime(0),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => this.handleError(value as string, fg.get('dayEnd')));

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

    this.formErrors.expensiveErr = totalRoomExpensive !== expensive;
  }

  private addPracticeAvailabilityControls(practice?: PracticeAvailabilityServer): void {
    const fg = this.examForm.get('practiceAvailability') as FormGroup;
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
    } else if (!Object.keys(fg.value)?.length || (Object.keys(fg.value).length && !fg.get(this.formValues.selectedWeekday.toString()))) {
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

  public practiceAvailabilityWeekWiseControlsArray(all = false, column: 1 | 2 | 0 = 0): FormArray[] {
    const controls: FormArray[] = [];

    const fg = this.examForm.get('practiceAvailability');
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

  public get formValues(): FormValues {
    return this.examForm.value;
  }

  public getFormArrayName(controlArray: FormArray): Weekday {
    return controlArray.value[0].weekday;
  }

  public handleRadioButtonChange(toggle: boolean): void {
    //  set practice availability toggle
    this.examForm.patchValue({ practiceAvailabilityToggle: toggle }, { emitEvent: false });

    if (toggle) {
      this.addPracticeAvailabilityControls();

      const controlsArrays = this.practiceAvailabilityWeekWiseControlsArray(true);
      this.handleSlotExistsError(controlsArrays);
      this.handleInvalidSlotRangeError(controlsArrays);

      this.cdr.detectChanges();
    }
  }

  public selectWeekday(selectedWeekday: Weekday): void {
    if (this.formValues.selectedWeekday === selectedWeekday) {
      return;
    }

    // const { weekday } = this.formValues;
    this.examForm.patchValue({ selectedWeekday });
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
    this.handleInvalidSlotRangeError(formArrays);
    this.handleSlotExistsError(formArrays);
  }

  public saveExam(): void {
    const requiredKeys: string[] = ['name', 'expensive', 'roomType'];
    let valid = true;

    requiredKeys.forEach((key) => {
      if (this.examForm.get(key)?.invalid) {
        this.examForm.get(key)?.markAsTouched();
        if (valid) {
          valid = false;
        }
      }
    });

    if (valid && this.formValues.roomsForExam?.every((room) => !room.selectRoom)) {
      this.formErrors.selectRoomErr = true;
    }

    if (this.formErrors.expensiveErr) {
      valid = false;
    }

    if (valid) {
      (this.examForm.get('roomsForExam') as FormArray).controls.forEach((control) => {
        if (control.get('duration')?.invalid) {
          control.get('duration')?.markAsTouched();
          if (valid) {
            valid = false;
          }
        }
      });
    }

    let controlArrays!: FormArray[];

    if (valid) {
      controlArrays = this.practiceAvailabilityWeekWiseControlsArray(true);
      valid = !this.isPracticeFormInvalid(controlArrays);
    }

    if (!valid) {
      this.notificationSvc.showNotification('Form is not valid.', NotificationType.WARNING);
      return;
    }

    this.submitting$$.next(true);

    controlArrays = this.practiceAvailabilityWeekWiseControlsArray(true);

    const createExamRequestData: CreateExamRequestData = {
      name: this.formValues.name,
      expensive: this.formValues.expensive,
      info: this.formValues.info ?? null,
      assistantCount: this.formValues.assistantCount,
      nursingCount: this.formValues.nursingCount,
      radiologistCount: this.formValues.radiologistCount,
      secretaryCount: this.formValues.secretaryCount,
      mandatoryUsers: [...(this.formValues.mandatoryStaffs ?? [])],
      usersList: [
        ...(this.formValues.assistants ?? []),
        ...(this.formValues.nursing ?? []),
        ...(this.formValues.radiologists ?? []),
        ...(this.formValues.secretaries ?? []),
      ],
      roomsForExam: [
        ...this.formValues.roomsForExam
          .filter((room) => room.selectRoom)
          .map(({ roomId, duration }) => ({
            roomId,
            duration,
          })),
      ],
      status: this.formValues.status,
      availabilityType: +!!this.formValues.practiceAvailabilityToggle,
      uncombinables: this.formValues.uncombinables ?? [],
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
                        dayStart: `${control.value.dayStart}:00`,
                        dayEnd: `${control.value.dayEnd}:00`,
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

    if (this.examDetails$$.value?.id) {
      createExamRequestData.id = this.examDetails$$.value?.id;
    }

    if (!createExamRequestData.practiceAvailability?.length) {
      createExamRequestData.availabilityType = AvailabilityType.Unavailable;
    }

    if (this.edit) {
      this.examApiSvc
        .updateExam$(createExamRequestData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(
          () => {
            this.notificationSvc.showNotification(`Exam added successfully`);
            let route: string;
            if (this.comingFromRoute === 'view') {
              route = '../view';
            } else {
              route = this.edit ? '/exam' : '../';
            }

            this.submitting$$.next(false);

            this.router.navigate([route], { relativeTo: this.route });
          },
          (err) => {
            this.submitting$$.next(false);
            this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
          },
        );
    } else {
      this.examApiSvc
        .createExam$(createExamRequestData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(
          () => {
            this.notificationSvc.showNotification(`Exam updated successfully`);
            let route: string;
            if (this.comingFromRoute === 'view') {
              route = '../view';
            } else {
              route = this.edit ? '/exam' : '../';
            }

            this.submitting$$.next(false);

            this.router.navigate([route], { relativeTo: this.route });
          },
          (err) => {
            this.submitting$$.next(false);
            this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
          },
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

  public handleTimeInput(
    time: string,
    control: AbstractControl | null | undefined,
    timingValueControl: AbstractControl | null | undefined,
    eleRef: InputDropdownComponent,
  ) {
    this.formatTime(time, control, timingValueControl);
    this.searchTime(time, timingValueControl);
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
    controlArrays.forEach((formArray) => {
      const { controls } = formArray;
      if (formArray.length > 1) {
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

  private checkStaffCountValidity(control: AbstractControl | null, countControl: AbstractControl | null, errorName: string) {
    if (!countControl?.value || (countControl.value && Number.isNaN(+countControl.value))) {
      return;
    }

    // (+countControl.value === 0 && control?.value?.length > 0)
    if (control?.value?.length < +countControl.value) {
      toggleControlError(control, errorName);
      return;
    }

    toggleControlError(control, errorName, false);
  }
}
