import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { InputComponent, NotificationType } from 'diflexmo-angular-design';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, of, startWith, switchMap, take, takeUntil } from 'rxjs';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { ConfirmActionModalComponent } from 'src/app/shared/components/confirm-action-modal.component';
import { PracticeHoursApiService } from 'src/app/core/services/practice-hours-api.service';
import { AbsenceApiService } from '../../../../core/services/absence-api.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { Absence, AddAbsenceRequestData, EndDateType, PriorityType, RepeatType } from '../../../../shared/models/absence.model';
import { Translate } from '../../../../shared/models/translate.model';
import { MonthToNamePipe } from '../../../../shared/pipes/month-to-name.pipe';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { WeekdayToNamePipe } from '../../../../shared/pipes/weekday-to-name.pipe';
import { ABSENCE_TYPE_ARRAY, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { CustomDateParserFormatter } from '../../../../shared/utils/dateFormat';
import { GeneralUtils } from '../../../../shared/utils/general.utils';
import { getNumberArray } from '../../../../shared/utils/getNumberArray';
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
	providers: [{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }],
})
export class AddAbsenceComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public absenceForm!: FormGroup;

	public filteredRoomList$$ = new BehaviorSubject<NameValue[] | null>(null);

	public filteredStaffs$$ = new BehaviorSubject<NameValue[] | null>(null);

	public submitting$$ = new BehaviorSubject<boolean>(false);

	public absence$$ = new BehaviorSubject<Absence | null>(null);

	public isAbsenceStaffRoomInvalid = new BehaviorSubject<boolean>(false);

	public modalData!: { absenceType: (typeof ABSENCE_TYPE_ARRAY)[number]; edit: boolean; absenceID: number; selectedDate?: Date };

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

	public minFromDate = {
		year: new Date().getFullYear(),
		month: new Date().getMonth() + 1,
		day: new Date().getDate(),
	};

	@ViewChild('repeatFrequency')
	private repeatFrequency!: InputComponent;

	private roomList: NameValue[] = [];

	private staffs: NameValue[] = [];

	private times: NameValue[];

	private selectedLang: string = ENG_BE;

	public startDateControl = new FormControl();

	public endDateControl = new FormControl();

	private addAppointmentImpactedAbsence: boolean = false;

	public endDateTypeControl = new FormControl(EndDateType.Until, []);

	public EndDateType = EndDateType;

	public ABSENCE_TYPE_ARRAY = ABSENCE_TYPE_ARRAY;

	public practiceHourMinMax$$ = new BehaviorSubject<{ min: string; max: string; grayOutMin: string; grayOutMax: string } | null>(null);

	private selectedDate: Date | undefined;

	public readonly currentDate = new Date();

	constructor(
		private modalSvc: ModalService,
		private fb: FormBuilder,
		private notificationSvc: NotificationDataService,
		private absenceApiSvc: AbsenceApiService,
		private weekdayToNamePipe: WeekdayToNamePipe,
		private monthToNamePipe: MonthToNamePipe,
		private roomApiSvc: RoomsApiService,
		private userApiSvc: UserApiService,
		private datePipe: DatePipe,
		private timeInIntervalPipe: TimeInIntervalPipe,
		private nameValuePairPipe: NameValuePairPipe,
		private cdr: ChangeDetectorRef,
		private shareDataSvc: ShareDataService,
		private priorityApiSvc: PrioritySlotApiService,
		public activeModal: NgbActiveModal,
		private practiceHoursApiSvc: PracticeHoursApiService,
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
		return this.absenceForm.value;
	}

	public get controls() {
		return this.absenceForm.controls;
	}

	public ngOnInit(): void {
		this.priorityApiSvc.repeatType$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.repeatTypes = items));

		this.modalSvc.dialogData$
			.pipe(
				switchMap((modalData) => {
					this.modalData = modalData;
					return this.practiceHoursApiSvc.practiceHours$;
				}),
				switchMap((practiceHours) => {
					this.minMaxTime(practiceHours);
					if (this.modalData?.absenceID) {
						return this.absenceApiSvc.getAbsenceByID$(this.modalData.absenceID);
					}
					return of({} as Absence);
				}),
				take(1),
			)
			.subscribe({
				next: (absence) => {
					console.log(absence);
					this.absence$$.next(absence);
					this.selectedDate = this.modalData.selectedDate;
					this.createForm(absence);
				},
			});

		this.roomApiSvc.allRooms$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (rooms) => {
				this.roomList = [...rooms.map((room) => ({ name: room.name, value: room.id.toString() }))];
				this.filteredRoomList$$.next([...this.roomList]);
				this.cdr.detectChanges();
			},
		});

		this.userApiSvc.allStaffs$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (staffs) => {
				this.staffs = [...staffs.map((staff) => ({ name: staff.fullName, value: staff.id.toString() }))];
				this.filteredStaffs$$.next([...this.staffs]);
				this.cdr.detectChanges();
			},
		});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => {
					this.selectedLang = lang;

					if (lang === ENG_BE) {
						this.statuses = Statuses;
					} else {
						this.statuses = StatusesNL;
					}
				},
			});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	private minMaxTime(practiceHours) {
		const value = [...practiceHours];
		let minMaxValue = value.reduce((pre: any, curr) => {
			let finalValue = { ...pre };
			if (!pre?.min || !pre?.max) {
				finalValue = { min: curr.dayStart, max: curr.dayEnd };
				return finalValue;
			}
			if (curr.dayStart && DateTimeUtils.TimeToNumber(curr.dayStart) <= DateTimeUtils.TimeToNumber(pre?.min)) {
				finalValue = { ...finalValue, min: curr.dayStart };
			}
			if (curr.dayEnd && DateTimeUtils.TimeToNumber(curr.dayEnd) >= DateTimeUtils.TimeToNumber(pre?.max)) {
				finalValue = { ...finalValue, max: curr.dayEnd };
			}
			return finalValue;
		}, {});

		const { min, max } = minMaxValue;
		if (
			DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(min)) > DateTimeUtils.TimeToNumber(min) ||
			DateTimeUtils.TimeToNumber('02:00:00') >= DateTimeUtils.TimeToNumber(min)
		) {
			minMaxValue = { ...minMaxValue, min: '00:00:00' };
		} else {
			minMaxValue = { ...minMaxValue, min: this.calculate(120, min, 'minus') };
		}
		if (
			DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(max)) < DateTimeUtils.TimeToNumber(max) / 100 ||
			DateTimeUtils.TimeToNumber('22:00:00') <= DateTimeUtils.TimeToNumber(max)
		) {
			minMaxValue = { ...minMaxValue, max: DateTimeUtils.LocalToUTCTimeTimeString('23:59:00') };
		} else if (DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(max)) > 2155) {
			minMaxValue = { ...minMaxValue, max: DateTimeUtils.LocalToUTCTimeTimeString('23:59:00') };
		} else {
			minMaxValue = { ...minMaxValue, max: this.calculate(120, max, 'plus') };
		}
		minMaxValue = { ...minMaxValue, grayOutMin: min, grayOutMax: max };
		this.practiceHourMinMax$$.next(minMaxValue);
	}

	private calculate(minutes: number, time: string, type: 'plus' | 'minus'): string {
		const date = new Date();
		const [hour, minute] = time.split(':');
		date.setHours(+hour);
		date.setMinutes(+minute);
		date.setSeconds(0);
		const finalDate = type === 'minus' ? new Date(date.getTime() - minutes * 60 * 1000) : new Date(date.getTime() + minutes * 60 * 1000);
		return this.datePipe.transform(finalDate, 'HH:mm') ?? '';
	}

	public closeModal(res: boolean) {
		this.activeModal.close(res);
	}

	public saveAbsence() {
		const isHoliday = this.modalData.absenceType === ABSENCE_TYPE_ARRAY[2];

		const valid = this.validateForm(isHoliday);
	
		if (!valid) {
			return;
		}
	
		const addAbsenceReqData = this.payload(isHoliday);
		this.submitting$$.next(true);
		this.saveDataToBackend(this.modalData.edit, addAbsenceReqData);
	}
	
	private validateForm(isHoliday: boolean): boolean {
		const { controls } = this.absenceForm;
		let valid = true;
		if (!this.formValues.roomList.length && !this.formValues.userList.length) {
			valid = false;
		}

		const invalid = ['name', 'startedAt', 'startTime', 'info'].some((key) => {
			controls[key].markAsTouched();
			return controls[key].invalid;
		});
		this.absenceForm.markAllAsTouched();

		if (invalid) {
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			return false;
		}

		if(this.handleRepeatValidation(controls)) return false;
	
		if (!isHoliday && !valid) {
			if (this.formValues.roomList || this.formValues.userList) {
				if (this.modalData.absenceType === 'rooms') {
					this.notificationSvc.showNotification(Translate.SelectRoom[this.selectedLang], NotificationType.WARNING);
				} else {
					this.notificationSvc.showNotification(Translate.SelectStaff[this.selectedLang], NotificationType.WARNING);
				}
				this.isAbsenceStaffRoomInvalid.next(true);
				return false;
			}

			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			this.isAbsenceStaffRoomInvalid.next(true);
			return false;
		}
	
		return true;
	}


	private handleRepeatValidation(controls: any): boolean {
		if (this.formValues.isRepeat) {
			if (this.endDateTypeControl.value === EndDateType.Until && controls['endedAt'].invalid) {
				controls['endedAt'].markAsTouched();
				this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
				return true;
			}
			switch (this.absenceForm.get('repeatType')?.value) {
				case RepeatType.Weekly:
				case RepeatType.Monthly: {
					const invalid = ['repeatFrequency', 'repeatDays'].some((key) => {
						controls[key].markAsTouched();
						return controls[key].invalid;
					});
					if (invalid) {
						this.absenceForm.markAllAsTouched();
						this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
						return true;
					}
					break;
				}
				default: {
					if (controls['repeatFrequency'].invalid) {
						controls['repeatFrequency'].markAsTouched();
						this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
						return true;
					}
					break;
				}
			}
		} else if (controls['endedAt'].invalid) {
			controls['endedAt'].markAsTouched();
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			return true;
		}

		return false;
	}
	

	private saveDataToBackend(edit: boolean, addAbsenceReqData: AddAbsenceRequestData) {
		if (edit) {
			this.absenceApiSvc
				.updateAbsence(addAbsenceReqData)
				.pipe(takeUntil(this.destroy$$))
				.subscribe({
					next: () => {
						this.notificationSvc.showNotification(
							this.modalData.absenceType === ABSENCE_TYPE_ARRAY?.[2]
								? Translate.SuccessMessage.PublicHolidayUpdate[this.selectedLang]
								: Translate.SuccessMessage.AbsenceUpdated[this.selectedLang],
						);
						this.submitting$$.next(false);
						this.closeModal(true);
					},
					error: (err) => {
						if (err?.error?.message === 'MSG_400_APMT_AFFECTS') this.openModal();
						this.submitting$$.next(false);
					},
				});
		} else {
			this.absenceApiSvc
				.addNewAbsence$(addAbsenceReqData)
				.pipe(takeUntil(this.destroy$$))
				.subscribe({
					next: () => {
						this.notificationSvc.showNotification(
							this.modalData.absenceType === ABSENCE_TYPE_ARRAY?.[2]
								? Translate.SuccessMessage.PublicHolidayAdded[this.selectedLang]
								: Translate.SuccessMessage.AbsenceAdded[this.selectedLang],
						);
						this.submitting$$.next(false);
						this.closeModal(true);
					},
					error: (err) => {
						if (err?.error?.message === 'MSG_400_APMT_AFFECTS') this.openModal();
						this.submitting$$.next(false);
					},
				});
		}
	}

	private payload(isHoliday): AddAbsenceRequestData {
		const { startedAt, endedAt, repeatDays, startTime, endTime, userList, roomList, ...rest } = this.formValues;

		const addAbsenceReqData: AddAbsenceRequestData = {
			...rest,
			isHoliday,
			startedAt: isHoliday
				? (this.datePipe.transform(
						new Date(`${startedAt.year}-${startedAt.month}-${startedAt.day} 00:00:00`.replace(/-/g, '/')),
						'yyyy-MM-dd HH:mm:ss',
				  ) as string)
				: (this.datePipe.transform(
						DateTimeUtils.LocalDateToUTCDate(
							new Date(`${startedAt.year}-${startedAt.month}-${startedAt.day} ${startTime}:00`.replace(/-/g, '/')),
							!rest.isHoliday,
						),
						'yyyy-MM-dd HH:mm:ss',
				  ) as string),
			endedAt: this.getEndDate(rest, endedAt, endTime, isHoliday),
			userList: isHoliday ? [] : userList,
			roomList: isHoliday ? [] : roomList,
			repeatType: rest.isRepeat ? rest.repeatType : null,
			repeatFrequency: rest.isRepeat && rest.repeatFrequency ? +rest.repeatFrequency.toString().split(' ')[0] : 0,
			repeatDays: '',
			addAppointmentImpactedAbsence: this.addAppointmentImpactedAbsence,
		};

		if (this.modalData.absenceType === 'rooms') {
			addAbsenceReqData.userList = [];
		} else {
			addAbsenceReqData.roomList = [];
		}

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

		return addAbsenceReqData;
	}

	private getEndDate(rest:any, endedAt:any, endTime: string, isHoliday: boolean) {
		let formattedEndedAt;

		if (this.endDateTypeControl?.value === EndDateType.Never && rest.isRepeat) {
			formattedEndedAt = null;
		} else {
			const date = new Date(`${endedAt.year}-${endedAt.month}-${endedAt.day} ${endTime}:00`.replace(/-/g, '/'));
			const formattedDate = isHoliday
				? (this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss') as string)
				: (this.datePipe.transform(DateTimeUtils.LocalDateToUTCDate(date, !rest.isHoliday), 'yyyy-MM-dd HH:mm:ss') as string);

			formattedEndedAt = formattedDate;
		}
		return formattedEndedAt;
	};

	public handleTimeInput(time: string, controlName: 'startTime' | 'endTime') {
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

	public handleDropdownSearch(searchText: string, type: 'room' | 'staff'): void {
		switch (type) {
			case 'room':
				this.filteredRoomList$$.next(GeneralUtils.FilterArray(this.roomList, searchText, 'name'));
				break;
			case 'staff':
				this.filteredStaffs$$.next(GeneralUtils.FilterArray(this.staffs, searchText, 'name'));
				break;
			default:
				break;
		}
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
			this.startDateControl.setValue(date);
		} else this.startDateControl.setValue(this.selectedDate && new Date() < this.selectedDate ? this.selectedDate : new Date());

		if (absenceDetails?.endedAt) {
			const date = new Date(absenceDetails.endedAt);
			endTime = this.datePipe.transform(date, 'HH:mm');

			if (endTime && !this.endTimes.find((time) => time.value === endTime)) {
				this.endTimes.push({ name: endTime, value: endTime });
			}
			this.endDateControl.setValue(date);
		}

		this.intilaizeForm(absenceDetails, absenceDetails?.startedAt ?? this.selectedDate ?? new Date(), startTime, endTime)

		this.setupValueChangeSubscriptions(absenceDetails);
	}


	private setupValueChangeSubscriptions(absenceDetails: Absence | undefined) {
		this.absenceForm
			.get('repeatType')
			?.valueChanges.pipe(debounceTime(0), distinctUntilChanged(), takeUntil(this.destroy$$))
			.subscribe({
				next: () => {
					if (!absenceDetails) {
						this.absenceForm.get('repeatDays')?.setValue(null);
					}
					if (this.repeatFrequency && (!this.absence$$.value || !Object.keys(this.absence$$.value)?.length)) {
						this.repeatFrequency.type = 'number';
					}
				},
			});

		combineLatest([
			this.absenceForm.get('userList')?.valueChanges.pipe(startWith('')) ?? [],
			this.absenceForm.get('roomList')?.valueChanges.pipe(startWith('')) ?? [],
		])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe({
				next: () => {
					this.isAbsenceStaffRoomInvalid.next(false);
				},
			});

		combineLatest([
			this.absenceForm.get('startTime')?.valueChanges.pipe(startWith('')) ?? [],
			this.absenceForm.get('endTime')?.valueChanges.pipe(startWith('')) ?? [],
			this.absenceForm.get('startedAt')?.valueChanges.pipe(startWith('')) ?? [],
			this.absenceForm.get('endedAt')?.valueChanges.pipe(startWith('')) ?? [],
		])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe({
				next: () => {
					this.handleTimeChange();
				},
			});
	}

	private intilaizeForm(absenceDetails: Absence | undefined, startedAt: Date | string , startTime: string, endTime: string) {
		this.absenceForm = this.fb.group({
			name: [absenceDetails?.name ?? '', [Validators.required]],
			startedAt: [
				startedAt
					? {
							year: new Date(startedAt).getFullYear(),
							month: new Date(startedAt).getMonth() + 1,
							day: new Date(startedAt).getDate(),
					  }
					: null,
				[Validators.required],
			],
			startTime: [startTime, [Validators.required]],
			endedAt: [
				absenceDetails?.endedAt
					? {
							year: new Date(absenceDetails?.endedAt).getFullYear(),
							month: new Date(absenceDetails?.endedAt).getMonth() + 1,
							day: new Date(absenceDetails?.endedAt).getDate(),
					  }
					: null,
				[Validators.required],
			],
			endTime: [endTime, [Validators.required]],
			isRepeat: [!!absenceDetails?.isRepeat, []],
			isHoliday: [!!absenceDetails?.isHoliday, []],
			repeatType: [RepeatType.Daily, []],
			repeatDays: ['', [Validators.required]],
			repeatFrequency: [null, [Validators.min(1)]],
			userList: [absenceDetails?.user?.length ? absenceDetails.user.map(({ id }) => id?.toString()) : [], [Validators.required]],
			roomList: [absenceDetails?.rooms?.length ? absenceDetails?.rooms.map(({ id }) => id?.toString()) : [], [Validators.required]],
			info: [absenceDetails?.info ?? '', []],
			priority: [absenceDetails?.priority ?? null, []],
		});

		setTimeout(() => {
			this.absenceForm.patchValue({
				startTime: startTime || DateTimeUtils.UTCTimeToLocalTimeString(this.practiceHourMinMax$$.value?.grayOutMin.slice(0, 5) ?? ''),
				endTime: endTime || DateTimeUtils.UTCTimeToLocalTimeString(this.practiceHourMinMax$$.value?.grayOutMax.slice(0, 5) ?? ''),
				repeatType: absenceDetails?.repeatType ?? RepeatType.Daily,
				repeatFrequency: absenceDetails?.repeatFrequency,
				repeatDays: absenceDetails?.repeatDays ? absenceDetails.repeatDays.split(',') : '',
			});

			this.absenceForm.get('startTime')?.markAsUntouched();
			this.absenceForm.get('endTime')?.markAsUntouched();
		}, 0);
		this.cdr.detectChanges();
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

	private searchTime(time: string, controlName: 'startTime' | 'endTime') {
		if (controlName === 'startTime') {
			this.startTimes = [...GeneralUtils.FilterArray(this.times, time, 'value')];
			return;
		}
		this.endTimes = [...GeneralUtils.FilterArray(this.times, time, 'value')];
	}

	private handleTimeChange() {
		if (!this.formValues.startTime || !this.formValues.startedAt?.day || !this.formValues.endTime) {
			return;
		}

		const { startedAt, endedAt, startTime, endTime, isRepeat } = this.formValues;

		if ((startedAt?.day === endedAt?.day && startedAt?.month === endedAt?.month && startedAt?.year === endedAt?.year) || isRepeat) {
			if (DateTimeUtils.TimeToNumber(startTime) >= DateTimeUtils.TimeToNumber(endTime)) {
				toggleControlError(this.absenceForm.get('startTime'), 'time');
				toggleControlError(this.absenceForm.get('endTime'), 'time');

				return;
			}
		}

		// formValues.isRepeat

		toggleControlError(this.absenceForm.get('startTime'), 'time', false);
		toggleControlError(this.absenceForm.get('endTime'), 'time', false);
	}

	public onDateChange(value: string, controlName: string) {
		this.absenceForm.get(controlName)?.setValue(DateTimeUtils.DateToDateDistributed(new Date(value)));
	}

	private openModal() {
		const modal = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				bodyText: this.modalData.absenceType === ABSENCE_TYPE_ARRAY[2] ? 'APPOINTMENT_AFFECTS_HOLIDAY' : 'APPOINTMENT_AFFECTS_ABSENCE',
				closeActiveModal: true,
			},
		});
		modal.closed.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (res) => {
				if (res) {
					this.addAppointmentImpactedAbsence = true;
					this.saveAbsence();
				}
			},
		});
	}
}
