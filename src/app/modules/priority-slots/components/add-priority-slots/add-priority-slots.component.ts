import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, of, startWith, switchMap, take, takeUntil } from 'rxjs';
import { InputComponent, NotificationType } from 'diflexmo-angular-design';
import { DatePipe } from '@angular/common';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { User, UserType } from 'src/app/shared/models/user.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { EndDateType, PriorityType, RepeatType } from '../../../../shared/models/absence.model';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { getNumberArray } from '../../../../shared/utils/getNumberArray';
import { WeekdayToNamePipe } from '../../../../shared/pipes/weekday-to-name.pipe';
import { MonthToNamePipe } from '../../../../shared/pipes/month-to-name.pipe';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { toggleControlError } from '../../../../shared/utils/toggleControlError';
import { ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { CustomDateParserFormatter } from '../../../../shared/utils/dateFormat';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { UserApiService } from '../../../../core/services/user-api.service';

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
	providers: [{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }],
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

	public repeatEvery!: any;

	public repeatTypeToName = {
		daily: 'Days',
		weekly: 'Weeks',
		monthly: 'Months',
	};

	public minFromDate = new Date();

	@ViewChild('repeatFrequency')
	private repeatFrequency!: InputComponent;

	private staffDetails: User[] = [];

	private times: NameValue[];

	private selectedLang: string = ENG_BE;

	public startDateControl = new FormControl();

	public endDateControl = new FormControl();

	public endDateTypeControl = new FormControl(EndDateType.Until, []);

	public EndDateType = EndDateType;

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
		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => {
				this.selectedLang = lang;
				this.repeatEvery = {
					weekly: [...this.getRepeatEveryItems(RepeatType.Weekly)],
					monthly: [...this.getRepeatEveryItems(RepeatType.Daily)],
				};

				if (lang === ENG_BE) {
					this.statuses = Statuses;
				} else {
					this.statuses = StatusesNL;
				}
			});
	}

	public get formValues(): FormValues {
		return this.prioritySlotForm.value;
	}

	public ngOnInit(): void {
		this.priorityApiSvc.repeatType$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.repeatTypes = items));

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
				if (prioritySlot?.endedAt) {
					this.endDateTypeControl.patchValue(EndDateType.Until);
				}
				this.createForm(prioritySlot);
			});

		this.userApiService.allStaffs$.pipe(takeUntil(this.destroy$$)).subscribe((staffs) => {
			this.staffDetails = staffs;

			const radiologist: NameValue[] = [];
			staffs.forEach((staff) => {
				const nameValue = { name: `${staff.firstname} ${staff.lastname}`, value: staff.id.toString() };
				if (staff.userType === UserType.Radiologist) radiologist.push(nameValue);
			});
			this.radiologist$$.next(radiologist);
		});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public closeModal(res: boolean) {
		this.modalSvc.close(res);
	}

	public savePrioritySlot() {
		const { controls } = this.prioritySlotForm;
		const invalid = ['startedAt', 'slotStartTime', 'priority', 'slotEndTime', 'nxtSlotOpenPct'].some((key) => {
			controls[key].markAsTouched();
			return controls[key].invalid;
		});
		if (invalid) {
			this.prioritySlotForm.markAllAsTouched();
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			return;
		}
		if (this.formValues.isRepeat) {
			if (this.endDateTypeControl.value === EndDateType.Until && controls['endedAt'].invalid) {
				controls['endedAt'].markAsTouched();
				this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
				return;
			}
			switch (this.prioritySlotForm.get('repeatType')?.value) {
				case RepeatType.Weekly:
				case RepeatType.Monthly: {
					const invalidMonth = ['repeatFrequency', 'repeatDays'].some((key) => {
						controls[key].markAsTouched();
						return controls[key].invalid;
					});
					if (invalidMonth) {
						this.prioritySlotForm.markAllAsTouched();
						this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
						return;
					}
					break;
				}
				default: {
					if (controls['repeatFrequency'].invalid) {
						controls['repeatFrequency'].markAsTouched();
						this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
						return;
					}
					break;
				}
			}
		} else if (controls['endedAt'].invalid) {
			controls['endedAt'].markAsTouched();
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			return;
		}
		controls['nxtSlotOpenPct'].markAsTouched();

		this.submitting$$.next(true);

		this.saveDataToBackend(this.requestData());
	}

	private requestData(): PrioritySlot {
		const { startedAt, endedAt, repeatDays, slotStartTime, slotEndTime, nxtSlotOpenPct, ...rest } = this.formValues;

		const addPriorityReqData: PrioritySlot = {
			...rest,
			startedAt: this.datePipe.transform(
				DateTimeUtils.LocalDateToUTCDate(
					new Date(`${startedAt.year}-${startedAt.month}-${startedAt.day} ${slotStartTime}:00`.replace(/-/g, '/')),
					true,
				),
				'yyyy-MM-dd HH:mm:ss',
			) as string,
			endedAt:
				this.endDateTypeControl?.value === EndDateType.Never && rest.isRepeat
					? null
					: (this.datePipe.transform(
							DateTimeUtils.LocalDateToUTCDate(
								new Date(`${endedAt.year}-${endedAt.month}-${endedAt.day} ${slotEndTime}:00`.replace(/-/g, '/')),
								true,
							),
							'yyyy-MM-dd HH:mm:ss',
					  ) as string),

			repeatType: rest.isRepeat ? rest.repeatType : null,
			repeatFrequency: rest.isRepeat && rest.repeatFrequency ? +rest.repeatFrequency.toString().split(' ')[0] : 0,
			repeatDays: '',
			slotStartTime: `${DateTimeUtils.LocalToUTCTimeTimeString(slotStartTime)}:00`,
			slotEndTime: `${DateTimeUtils.LocalToUTCTimeTimeString(slotEndTime)}:00`,
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

		return addPriorityReqData;
	}

	private saveDataToBackend(addPriorityReqData: PrioritySlot) {
		if (this.modalData.edit) {
			this.priorityApiSvc
				.updatePrioritySlot$(addPriorityReqData)
				.pipe(takeUntil(this.destroy$$))
				.subscribe({
					next: () => {
						this.notificationSvc.showNotification(Translate.SuccessMessage.PrioritySlotsUpdated[this.selectedLang]);
						this.submitting$$.next(false);
						this.closeModal(true);
					},
					error: () => {
						this.submitting$$.next(false);
					},
				});
		} else {
			this.priorityApiSvc
				.savePrioritySlot$(addPriorityReqData)
				.pipe(takeUntil(this.destroy$$))
				.subscribe({
					next: () => {
						this.notificationSvc.showNotification(Translate.SuccessMessage.PrioritySlotsAdded[this.selectedLang]);
						this.submitting$$.next(false);
						this.closeModal(true);
					},
					error: () => {
						this.submitting$$.next(false);
					},
				});
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
			{ emitEvent: false },
		);
	}

	public handleFocusOut() {
		this.updateRepeatFrequency();
	}

	public handleFocusIn() {
		this.updateRepeatFrequency('number');
	}

	public handleExpenseInput(e: Event, element: InputComponent, control: AbstractControl | null | undefined) {
		const htmlElement: InputComponent = element;
		if (!element.value) {
			e.preventDefault();
			return;
		}

		if (element.value > 100) {
			const newValue = 100;

			htmlElement.value = newValue;
			if (control) {
				control.setValue(newValue);
			}
		}
		if (element.value <= 0) {
			htmlElement.value = 1;
			if (control) {
				control.setValue(1);
			}
		}
	}

	private createForm(prioritySlotDetails?: PrioritySlot | undefined): void {
		const { startTime, endTime } = this.getStartAndEndTime(prioritySlotDetails);

		const radiologists: string[] = [];

		if (this.staffDetails.length) {
			this.staffDetails.forEach((u) => {
				if (u.userType === UserType.Radiologist) radiologists.push(u.id.toString());
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
				[Validators.required],
			],
			slotEndTime: [startTime, [Validators.required]],
			isRepeat: [!!prioritySlotDetails?.isRepeat, []],
			repeatType: [RepeatType.Daily, []],
			repeatDays: ['', [Validators.required]],
			repeatFrequency: [prioritySlotDetails?.repeatFrequency, [Validators.required, Validators.min(1)]],
			userList: [prioritySlotDetails?.users?.length ? prioritySlotDetails.users.map(({ id }) => id.toString()) : [], []],
			priority: [prioritySlotDetails?.priority ?? null, [Validators.required]],
			nxtSlotOpenPct: [
				prioritySlotDetails?.nxtSlotOpenPct ?? null,
				[Validators.required, Validators.min(0), Validators.max(100), Validators.minLength(1)],
			],
		});

		if (prioritySlotDetails?.id) {
			setTimeout(() => {
				this.prioritySlotForm.patchValue({
					slotStartTime: startTime,
					slotEndTime: endTime,
					repeatType: prioritySlotDetails?.repeatType,
					repeatDays: prioritySlotDetails?.repeatDays ? prioritySlotDetails.repeatDays.split(',') : '',
				});
				this.cdr.detectChanges();
			}, 0);
		}

		this.cdr.detectChanges();

		this.handleFormSubscription(prioritySlotDetails);
	}

	private getStartAndEndTime(prioritySlotDetails: PrioritySlot | undefined): { startTime; endTime } {
		let startTime;
		let endTime;

		if (prioritySlotDetails?.startedAt) {
			const date = new Date(prioritySlotDetails.startedAt);
			startTime = this.datePipe.transform(date, 'HH:mm');

			if (startTime && !this.startTimes.find((time) => time.value === startTime)) {
				this.startTimes.push({ name: startTime, value: startTime });
			}
			this.startDateControl.setValue(date);
		}

		if (prioritySlotDetails?.endedAt) {
			const date = new Date(prioritySlotDetails.endedAt);
			endTime = this.datePipe.transform(date, 'HH:mm');

			if (endTime && !this.endTimes.find((time) => time.value === endTime)) {
				this.endTimes.push({ name: endTime, value: endTime });
			}
			this.endDateControl.setValue(date);
		}

		return { startTime, endTime };
	}

	private handleFormSubscription(prioritySlotDetails: PrioritySlot | undefined) {
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
			this.prioritySlotForm?.get('slotStartTime')?.valueChanges.pipe(startWith('')) ?? [],
			this.prioritySlotForm?.get('slotEndTime')?.valueChanges.pipe(startWith('')) ?? [],
			this.prioritySlotForm?.get('startedAt')?.valueChanges.pipe(startWith('')) ?? [],
			this.prioritySlotForm?.get('endedAt')?.valueChanges.pipe(startWith('')) ?? [],
		])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe(() => this.handleTimeChange());

		this.prioritySlotForm
			.get('slotEndTime')
			?.valueChanges.pipe(debounceTime(0), distinctUntilChanged(), takeUntil(this.destroy$$))
			.subscribe(() => {
				this.handleTimeChange();
			});
	}

	private getRepeatEveryItems(repeatType: RepeatType): NameValue[] {
		switch (repeatType) {
			case RepeatType.Daily:
				return getNumberArray(31).map((d) => ({ name: d.toString(), value: d.toString() }));
			case RepeatType.Weekly:
				return getNumberArray(6, 0).map((w) => ({
					name: Translate[this.weekdayToNamePipe.transform(w)][this.selectedLang],
					value: w.toString(),
				}));
			case RepeatType.Monthly:
				return getNumberArray(12).map((m) => ({ name: this.monthToNamePipe.transform(m), value: m.toString() }));
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

		const { repeatFrequency } = this.formValues;

		switch (type) {
			case 'text':
				this.repeatFrequency.type = 'text';
				if (
					!repeatFrequency.toString().includes(this.repeatTypeToName[this.formValues.repeatType]) &&
					+repeatFrequency.toString().split(' ')[0] > 0
				) {
					this.prioritySlotForm.patchValue({
						repeatFrequency: `${repeatFrequency.toString().split(' ')[0]} ${
							Translate.RepeatType[this.repeatTypeToName[this.formValues.repeatType]][this.selectedLang]
						}`,
					});
				}
				this.cdr.detectChanges();
				break;
			case 'number':
				if (repeatFrequency.split(' ')[0] && !isNaN(+repeatFrequency.split(' ')[0])) {
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
		if (
			this.formValues.slotStartTime !== '' &&
			DateTimeUtils.TimeToNumber(this.formValues.slotStartTime) < DateTimeUtils.TimeToNumber(this.formValues.slotEndTime)
		) {
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

		const { startedAt, endedAt, slotStartTime, slotEndTime } = this.formValues;

		if (startedAt.day === endedAt.day && startedAt.month === endedAt.month && startedAt.year === endedAt.year) {
			if (DateTimeUtils.TimeToNumber(slotStartTime) >= DateTimeUtils.TimeToNumber(slotEndTime)) {
				toggleControlError(this.prioritySlotForm.get('slotStartTime'), 'time');
				toggleControlError(this.prioritySlotForm.get('slotEndTime'), 'time');

				return;
			}
		}

		toggleControlError(this.prioritySlotForm.get('slotStartTime'), 'time', false);
		toggleControlError(this.prioritySlotForm.get('slotEndTime'), 'time', false);
	}

	public onDateChange(value: string, controlName: string) {
		this.prioritySlotForm.get(controlName)?.setValue(DateTimeUtils.DateToDateDistributed(new Date(value)));
	}
}
