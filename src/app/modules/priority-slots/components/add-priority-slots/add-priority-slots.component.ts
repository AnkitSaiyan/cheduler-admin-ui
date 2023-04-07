import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    of,
    startWith,
    switchMap,
    take,
    takeUntil
} from 'rxjs';
import {InputComponent, NotificationType} from 'diflexmo-angular-design';
import {DatePipe} from '@angular/common';
import {PrioritySlotApiService} from 'src/app/core/services/priority-slot-api.service';
import {PrioritySlot} from 'src/app/shared/models/priority-slots.model';
import {User, UserType} from 'src/app/shared/models/user.model';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {GeneralUtils} from 'src/app/shared/utils/general.utils';
import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {ModalService} from '../../../../core/services/modal.service';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {PriorityType, RepeatType} from '../../../../shared/models/absence.model';
import {NameValue} from '../../../../shared/components/search-modal.component';
import {getNumberArray} from '../../../../shared/utils/getNumberArray';
import {WeekdayToNamePipe} from '../../../../shared/pipes/weekday-to-name.pipe';
import {MonthToNamePipe} from '../../../../shared/pipes/month-to-name.pipe';
import {TimeInIntervalPipe} from '../../../../shared/pipes/time-in-interval.pipe';
import {NameValuePairPipe} from '../../../../shared/pipes/name-value-pair.pipe';
import {toggleControlError} from '../../../../shared/utils/toggleControlError';
import {DUTCH_BE, ENG_BE, Statuses, StatusesNL} from '../../../../shared/utils/const';
import {Translate} from '../../../../shared/models/translate.model';
import {CustomDateParserFormatter} from '../../../../shared/utils/dateFormat';
import {DateTimeUtils} from "../../../../shared/utils/date-time.utils";
import {UserApiService} from "../../../../core/services/user-api.service";

interface FormValues {
    name: string;
    startedAt: {
        year: number;
        month: number;
        day: number;
    };
    slotStartTime: string;
    endedAt: {
        year: number;
        month: number;
        day: number;
    };
    slotEndTime: string;
    isRepeat: boolean;
    priority: PriorityType;
    repeatType: RepeatType;
    repeatFrequency: string;
    repeatDays: string[];
    userList: number[];
    nxtSlotOpenPct: number;
}

@Component({
    selector: 'dfm-add-priority-slots',
    templateUrl: './add-priority-slots.component.html',
    styleUrls: ['./add-priority-slots.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter}],
})
export class AddPrioritySlotsComponent extends DestroyableComponent implements OnInit, OnDestroy {
    public prioritySlotForm!: FormGroup;

    public radiologist$$ = new BehaviorSubject<NameValue[] | null>(null);
    public submitting$$ = new BehaviorSubject<boolean>(false);
    public prioritySlot$$ = new BehaviorSubject<PrioritySlot | null | undefined>(null);

    public modalData!: { edit: boolean; prioritySlotDetails: PrioritySlot };
    public priorityType = PriorityType;
    public repeatTypes: any[] = [];
    public startTimes: NameValue[];
    public endTimes: NameValue[];
    public statuses = Statuses;
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

    @ViewChild('repeatFrequency')
    private repeatFrequency!: InputComponent;

    private staffDetails: User[] = [];
    private times: NameValue[];
    private selectedLang: string = ENG_BE;

    constructor(
        private modalSvc: ModalService,
        private fb: FormBuilder,
        private notificationSvc: NotificationDataService,
        private priorityApiSvc: PrioritySlotApiService,
        private weekdayToNamePipe: WeekdayToNamePipe,
        private monthToNamePipe: MonthToNamePipe,
        private userApiService: UserApiService,
        private datePipe: DatePipe,
        private timeInIntervalPipe: TimeInIntervalPipe,
        private nameValuePairPipe: NameValuePairPipe,
        private cdr: ChangeDetectorRef,
        private shareDataSvc: ShareDataService,
    ) {
        super();

        this.times = this.nameValuePairPipe.transform(this.timeInIntervalPipe.transform(5));
        this.startTimes = [...this.times];
        this.endTimes = [...this.times];
    }

    public get formValues(): FormValues {
        return this.prioritySlotForm.value;
    }

    public ngOnInit(): void {
        this.priorityApiSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.repeatTypes = items));

        this.modalSvc.dialogData$
            .pipe(
                switchMap((modalData) => {
                    this.modalData = modalData;
                    if (modalData?.prioritySlotDetails?.id) {
                        return this.priorityApiSvc.getPrioritySlotsByID(modalData?.prioritySlotDetails.id);
                    }
                    this.createForm();

                    return of({} as PrioritySlot);
                }),
                take(1),
            )
            .subscribe((prioritySlot) => {
                this.prioritySlot$$.next(prioritySlot);
                this.createForm(prioritySlot);
            });

        this.userApiService.staffs$.pipe(takeUntil(this.destroy$$)).subscribe((staffs) => {
            this.staffDetails = staffs;

            const radiologist: NameValue[] = [];
            staffs.forEach((staff) => {
                const nameValue = {name: `${staff.firstname} ${staff.lastname}`, value: staff.id.toString()};
                switch (staff.userType) {
                    case UserType.Radiologist:
                        radiologist.push(nameValue);
                        break;
                    default:
                }
            });
            this.radiologist$$.next(radiologist);
        });

        this.shareDataSvc
            .getLanguage$()
            .pipe(takeUntil(this.destroy$$))
            .subscribe((lang) => {
                this.selectedLang = lang;

                switch (lang) {
                    case ENG_BE:
                        this.statuses = Statuses;
                        break;
                    case DUTCH_BE:
                        this.statuses = StatusesNL;
                        break;
                }
            });
    }

    public override ngOnDestroy() {
        super.ngOnDestroy();
    }

    public closeModal(res: boolean) {
        this.modalSvc.close(res);
        // this.ngOnDestroy();
    }

    public savePrioritySlot() {
        const {controls} = this.prioritySlotForm;
        if (this.formValues.isRepeat) {
            if (this.prioritySlotForm.invalid) {
                this.prioritySlotForm.markAllAsTouched();
                this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);

                Object.keys(this.prioritySlotForm.controls).map((key) => this.prioritySlotForm.get(key)?.markAsTouched());

                return;
            }
        } else {
            const invalid = ['startedAt', 'slotStartTime', 'priority', 'slotEndTime'].some((key) => {
                controls[key].markAsTouched();
                return controls[key].invalid;
            });

            if (invalid) {
                this.prioritySlotForm.markAllAsTouched();
                this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
                return;
            }
        }

        controls['nxtSlotOpenPct'].markAsTouched();

        this.submitting$$.next(true);

        const {startedAt, endedAt, repeatDays, slotStartTime, slotEndTime, nxtSlotOpenPct, ...rest} = this.formValues;

        const addPriorityReqData: PrioritySlot = {
            ...rest,
            startedAt: `${startedAt.year}-${startedAt.month}-${startedAt.day} ${slotStartTime}:00`,
            endedAt: `${endedAt.year}-${endedAt.month}-${endedAt.day} ${slotEndTime}:00`,
            repeatType: rest.isRepeat ? rest.repeatType : null,
            repeatFrequency: rest.isRepeat && rest.repeatFrequency ? +rest.repeatFrequency.toString().split(' ')[0] : 0,
            repeatDays: '',
            slotStartTime: `${slotStartTime}:00`,
            slotEndTime: `${slotEndTime}:00`,
            users: [],
            nxtSlotOpenPct: +nxtSlotOpenPct,
        };

        if (rest.isRepeat && repeatDays?.length) {
            addPriorityReqData.repeatDays = repeatDays?.reduce((acc, curr, i) => {
                if (repeatDays?.length && i < repeatDays.length - 1) {
                    return `${acc + curr},`;
                }
                return acc + curr;
            }, '');
        }

        if (this.modalData?.prioritySlotDetails) {
            addPriorityReqData.id = this.modalData.prioritySlotDetails.id;
        }

        if (this.modalData.edit) {
            this.priorityApiSvc
                .updatePrioritySlot$(addPriorityReqData)
                .pipe(takeUntil(this.destroy$$))
                .subscribe(
                    () => {
                        this.notificationSvc.showNotification(Translate.SuccessMessage.PrioritySlotsUpdated[this.selectedLang]);
                        this.submitting$$.next(false);
                        this.closeModal(true);
                    },
                    (err) => {
                        this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
                        this.submitting$$.next(false);
                    },
                );
        } else {
            this.priorityApiSvc
                .savePrioritySlot$(addPriorityReqData)
                .pipe(takeUntil(this.destroy$$))
                .subscribe(
                    () => {
                        this.notificationSvc.showNotification(Translate.SuccessMessage.PrioritySlotsAdded[this.selectedLang]);
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

    public handleTimeInput(time: string, controlName: 'slotStartTime' | 'slotEndTime') {
        this.searchTime(time, controlName);
        const formattedTime = DateTimeUtils.FormatTime(time, 24, 5);

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

        this.prioritySlotForm.patchValue(
            {
                [controlName]: formattedTime,
            },
            {emitEvent: false},
        );
    }

    public handleFocusOut() {
        this.updateRepeatFrequency();
    }

    public handleFocusIn() {
        this.updateRepeatFrequency('number');
    }

    public handleChange(repeatFrequency: InputComponent) {
    }

    public handleExpenseInput(e: Event, element: InputComponent, control: AbstractControl | null | undefined) {
        if (!element.value) {
            e.preventDefault();
            return;
        }

        if (element.value > 100) {
            const newValue = 100;

            element.value = newValue;
            if (control) {
                control.setValue(newValue);
            }
        }
        if (element.value <= 0) {
            element.value = 1;
            if (control) {
                control.setValue(1);
            }
        }
    }

    private createForm(prioritySlotDetails?: PrioritySlot | undefined): void {
        let startTime;
        let endTime;

        if (prioritySlotDetails?.startedAt) {
            const date = new Date(prioritySlotDetails.startedAt);
            startTime = this.datePipe.transform(date, 'HH:mm');

            if (startTime && !this.startTimes.find((time) => time.value === startTime)) {
                this.startTimes.push({name: startTime, value: startTime});
            }
        }

        if (prioritySlotDetails?.endedAt) {
            const date = new Date(prioritySlotDetails.endedAt);
            endTime = this.datePipe.transform(date, 'HH:mm');

            if (endTime && !this.endTimes.find((time) => time.value === endTime)) {
                this.endTimes.push({name: endTime, value: endTime});
            }
        }

        // let slotStartTime;
        // let slotEndTime;
        //
        // if (prioritySlotDetails?.startedAt) {
        //   const date = new Date(prioritySlotDetails.startedAt);
        //   slotStartTime = this.datePipe.transform(date, 'HH:mm');
        //
        //   if (slotStartTime && !this.startTimes.find((time) => time.value === slotStartTime)) {
        //     this.startTimes.push({ name: slotStartTime, value: slotStartTime });
        //   }
        // }
        //
        // if (prioritySlotDetails?.endedAt) {
        //   const date = new Date(prioritySlotDetails.endedAt);
        //   slotEndTime = this.datePipe.transform(date, 'HH:mm');
        //
        //
        //   if (slotEndTime && !this.endTimes.find((time) => time.value === slotEndTime)) {
        //     this.endTimes.push({ name: slotEndTime, value: slotEndTime });
        //   }
        // }
        //
        // if (prioritySlotDetails?.slotEndTime) {
        //   slotEndTime = prioritySlotDetails?.slotEndTime.slice(0, -3);
        // }

        const radiologists: string[] = [];

        if (this.staffDetails.length) {
            this.staffDetails.forEach((u) => {
                switch (u.userType) {
                    case UserType.Radiologist:
                        radiologists.push(u.id.toString());
                        break;
                    default:
                }
            });

            this.prioritySlotForm?.patchValue({
                radiologists,
            });
        }

        this.prioritySlotForm = this.fb.group({
            startedAt: [
                prioritySlotDetails?.startedAt
                    ? {
                        year: new Date(prioritySlotDetails.startedAt).getFullYear(),
                        month: new Date(prioritySlotDetails.startedAt).getMonth() + 1,
                        day: new Date(prioritySlotDetails.startedAt).getDate(),
                    }
                    : null,
                [Validators.required],
            ],
            slotStartTime: [endTime, [Validators.required]],
            endedAt: [
                prioritySlotDetails?.endedAt
                    ? {
                        year: new Date(prioritySlotDetails.endedAt).getFullYear(),
                        month: new Date(prioritySlotDetails.endedAt).getMonth() + 1,
                        day: new Date(prioritySlotDetails.endedAt).getDate(),
                    }
                    : null,
                [],
            ],
            slotEndTime: [startTime, [Validators.required]],
            isRepeat: [!!prioritySlotDetails?.isRepeat, []],
            repeatType: [null, []],
            repeatDays: ['', []],
            repeatFrequency: [
                prioritySlotDetails?.isRepeat && prioritySlotDetails?.repeatFrequency && prioritySlotDetails.repeatType
                    ? `${prioritySlotDetails.repeatFrequency} ${this.repeatTypeToName[prioritySlotDetails.repeatType]}`
                    : null,
                [Validators.min(1)],
            ],
            userList: [prioritySlotDetails?.users?.length ? prioritySlotDetails.users.map(({id}) => id.toString()) : [], []],
            priority: [prioritySlotDetails?.priority ?? null, [Validators.required]],
            nxtSlotOpenPct: [prioritySlotDetails?.nxtSlotOpenPct ?? null, [Validators.required, Validators.max(100), Validators.minLength(1)]],
        });

        setTimeout(
            () =>
                this.prioritySlotForm.patchValue({
                    slotStartTime: startTime,
                    slotEndTime: endTime,
                    repeatType: prioritySlotDetails?.repeatType,
                    repeatFrequency:
                        prioritySlotDetails?.isRepeat && prioritySlotDetails?.repeatFrequency && prioritySlotDetails.repeatType
                            ? `${prioritySlotDetails.repeatFrequency} ${this.repeatTypeToName[prioritySlotDetails.repeatType]}`
                            : null,
                    repeatDays: prioritySlotDetails?.repeatDays ? prioritySlotDetails.repeatDays.split(',') : '',
                }),
            0,
        );

        this.cdr.detectChanges();

        this.prioritySlotForm
            ?.get('repeatType')
            ?.valueChanges.pipe(debounceTime(0), distinctUntilChanged(), takeUntil(this.destroy$$))
            .subscribe(() => {
                if (!prioritySlotDetails) {
                    this.prioritySlotForm?.get('repeatDays')?.setValue(null);
                }
                this.updateRepeatFrequency();
            });

        this.prioritySlotForm
            ?.get('slotStartTime')
            ?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
            .subscribe(() => {
                this.handleTimeChange();
            });

        combineLatest([
            this.prioritySlotForm?.get('slotStartTime')?.valueChanges.pipe(startWith('')),
            this.prioritySlotForm?.get('slotEndTime')?.valueChanges.pipe(startWith('')),
            this.prioritySlotForm?.get('startedAt')?.valueChanges.pipe(startWith('')),
            this.prioritySlotForm?.get('endedAt')?.valueChanges.pipe(startWith('')),
        ])
            .pipe(debounceTime(0), takeUntil(this.destroy$$))
            .subscribe(() => this.handleTimeChange());

        this.prioritySlotForm
            .get('slotEndTime')
            ?.valueChanges.pipe(debounceTime(0), distinctUntilChanged(), takeUntil(this.destroy$$))
            .subscribe((data: any) => {
                this.handleTimeChange();
            });
    }

    private getRepeatEveryItems(repeatType: RepeatType): NameValue[] {
        switch (repeatType) {
            case RepeatType.Daily:
                return getNumberArray(31).map((d) => ({name: d.toString(), value: d.toString()}));
            case RepeatType.Weekly:
                return getNumberArray(6, 0).map((w) => ({
                    name: this.weekdayToNamePipe.transform(w),
                    value: w.toString()
                }));
            case RepeatType.Monthly:
                return getNumberArray(12).map((m) => ({name: this.monthToNamePipe.transform(m), value: m.toString()}));
            default:
                return [];
        }
    }

    private searchTime(time: string, controlName: 'slotStartTime' | 'slotEndTime') {
        if (controlName === 'slotStartTime') {
            this.startTimes = [...GeneralUtils.FilterArray(this.times, time, 'value')];
            return;
        }
        this.endTimes = [...GeneralUtils.FilterArray(this.times, time, 'value')];
    }

    private updateRepeatFrequency(type: 'number' | 'text' = 'text') {
        if (!this.repeatFrequency?.value || !this.formValues.repeatFrequency) {
            return;
        }

        const {repeatFrequency} = this.formValues;

        switch (type) {
            case 'text':
                this.repeatFrequency.type = 'text';
                if (
                    !repeatFrequency.toString().includes(this.repeatTypeToName[this.formValues.repeatType]) &&
                    +repeatFrequency.toString().split(' ')[0] > 0
                ) {
                    this.prioritySlotForm.patchValue({
                        repeatFrequency: `${repeatFrequency.toString().split(' ')[0]} ${this.repeatTypeToName[this.formValues.repeatType]}`,
                    });
                }
                this.cdr.detectChanges();
                break;
            case 'number':
                if (repeatFrequency.split(' ')[0] && !Number.isNaN(+repeatFrequency.split(' ')[0])) {
                    this.prioritySlotForm.patchValue({
                        repeatFrequency: +repeatFrequency.split(' ')[0],
                    });
                }
                this.repeatFrequency.type = 'number';
                break;
            default:
        }
    }

    private handleTimeChange() {
        console.log('in');
        if (this.formValues.slotStartTime !== '' && DateTimeUtils.TimeToNumber(this.formValues.slotStartTime) < DateTimeUtils.TimeToNumber(this.formValues.slotEndTime)) {
            toggleControlError(this.prioritySlotForm.get('slotStartTime'), 'time', false);
            toggleControlError(this.prioritySlotForm.get('slotEndTime'), 'time', false);
            return;
        }

        if (
            DateTimeUtils.TimeToNumber(this.formValues.slotStartTime) >= DateTimeUtils.TimeToNumber(this.formValues.slotEndTime) ||
            DateTimeUtils.TimeToNumber(this.formValues.slotEndTime) <= DateTimeUtils.TimeToNumber(this.formValues.slotStartTime)
        ) {
            toggleControlError(this.prioritySlotForm.get('slotStartTime'), 'time', true);
            toggleControlError(this.prioritySlotForm.get('slotEndTime'), 'time', true);

            return;
        }

        if (!this.formValues.slotStartTime || !this.formValues.startedAt?.day || !this.formValues.slotEndTime || !this.formValues.endedAt?.day) {
            return;
        }

        const {startedAt, endedAt, slotStartTime, slotEndTime} = this.formValues;

        if (startedAt.day === endedAt.day && startedAt.month === endedAt.month && startedAt.year === endedAt.year) {
            if (DateTimeUtils.TimeToNumber(slotStartTime) >= DateTimeUtils.TimeToNumber(slotEndTime)) {
                toggleControlError(this.prioritySlotForm.get('slotStartTime'), 'time');
                toggleControlError(this.prioritySlotForm.get('slotEndTime'), 'time');

                return;
            }

            // this.cdr.detectChanges();
        }

        toggleControlError(this.prioritySlotForm.get('slotStartTime'), 'time', false);
        toggleControlError(this.prioritySlotForm.get('slotEndTime'), 'time', false);
    }
}
