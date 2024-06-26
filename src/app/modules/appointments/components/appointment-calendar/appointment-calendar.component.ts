import { DatePipe } from '@angular/common';
import { Component, ContentChild, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
	BehaviorSubject,
	Observable,
	catchError,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	firstValueFrom,
	map,
	switchMap,
	take,
	takeUntil,
	throwError,
} from 'rxjs';
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';
import { DraggableService } from 'src/app/core/services/draggable.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { PermissionService } from 'src/app/core/services/permission.service';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';
import { RoomsApiService } from 'src/app/core/services/rooms-api.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from 'src/app/shared/components/confirm-action-modal.component';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { RepeatType } from 'src/app/shared/models/absence.model';
import { getDateOfMonth, getDurationMinutes } from 'src/app/shared/models/calendar.model';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { Translate } from 'src/app/shared/models/translate.model';
import { UserRoleEnum } from 'src/app/shared/models/user.model';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { PracticeHoursApiService } from '../../../../core/services/practice-hours-api.service';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { Appointment, AppointmentSlotsRequestData } from '../../../../shared/models/appointment.model';
import { Exam } from '../../../../shared/models/exam.model';
import { PracticeAvailabilityServer } from '../../../../shared/models/practice.model';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { ENG_BE } from '../../../../shared/utils/const';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { getNumberArray } from '../../../../shared/utils/getNumberArray';
import { AddAppointmentModalComponent } from '../add-appointment-modal/add-appointment-modal.component';
import { LoaderService } from 'src/app/core/services/loader.service';
import { MatCalendar } from '@angular/material/datepicker';

@Component({
	selector: 'dfm-appointment-calendar',
	templateUrl: './appointment-calendar.component.html',
	styleUrls: ['./appointment-calendar.component.scss'],
})
export class AppointmentCalendarComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public calendarViewFormControl = new FormControl();

	@ContentChild(TemplateRef) topAction!: TemplateRef<any>;

	@ViewChild('calendar') datepicker!: MatCalendar<Date>;

	public dateControl = new FormControl();

	public selectedDate$$: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());

	public calendarViewType: NameValue[] = [];

	public changeDate$$ = new BehaviorSubject<number>(0);

	public changeWeek$$ = new BehaviorSubject<number>(0);

	public changeMonth$$ = new BehaviorSubject<number>(0);

	public newDate$$ = new BehaviorSubject<{ date: Date | null; isWeekChange: boolean }>({ date: null, isWeekChange: false });

	public headerList: NameValue[] = [];

	public filteredAppointments$$: BehaviorSubject<any[]>;

	public selectedSlot$$: BehaviorSubject<any>;

	public weekdayToPractice$$ = new BehaviorSubject<any>(null);

	public practiceHourMinMax$$ = new BehaviorSubject<{ min: string; max: string; grayOutMin: string; grayOutMax: string } | null>(null);

	private selectedLang: string = ENG_BE;

	private pixelPerMinute = 4;

	public prioritySlots$$: BehaviorSubject<any>;

	private appointmentData$!: Observable<any[]>;

	private isDayView$$ = new BehaviorSubject<boolean>(false);

	public appointmentDataForMonthView$!: Observable<{ [key: string]: any[][] }>;

	public appointmentDataForWeekView$!: Observable<{ [key: string]: any[][] }>;

	public isLoader$$ = new BehaviorSubject(true);

	public appointmentDataForDayView$!: Observable<{
		[key: string]: {
			[key: number]: {
				appointment: Appointment;
				exams: Exam[];
			}[];
		};
	}>;

	public paramsToCalendarView = {
		m: 'month',
		w: 'week',
		d: 'day',
	};

	constructor(
		private roomApiSvc: RoomsApiService,
		private datePipe: DatePipe,
		private appointmentApiSvc: AppointmentApiService,
		private router: Router,
		private practiceHoursApiSvc: PracticeHoursApiService,
		private timeIntervalPipe: TimeInIntervalPipe,
		private modalSvc: ModalService,
		public permissionSvc: PermissionService,
		private route: ActivatedRoute,
		private notificationSvc: NotificationDataService,
		private shareDataSvc: ShareDataService,
		private priorityApiSvc: PrioritySlotApiService,
		private utcToLocalPipe: UtcToLocalPipe,
		private translate: TranslateService,
		private draggableSvc: DraggableService,
		private loaderSvc: LoaderService,
	) {
		super();
		this.filteredAppointments$$ = new BehaviorSubject<any[]>([]);
		this.selectedSlot$$ = new BehaviorSubject<any>(null);
		this.prioritySlots$$ = new BehaviorSubject<any>({});
		this.appointmentApiSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				this.calendarViewType = items;
			},
		});
	}

	public ngOnInit(): void {
		this.route.queryParams.pipe(debounceTime(100), takeUntil(this.destroy$$)).subscribe((params) => {
			if (params['v'] !== 't') {
				this.calendarViewFormControl.setValue(this.paramsToCalendarView[params['v']]);
			}
			if (!params['d']) {
				this.updateQuery('', this.selectedDate$$.value, true);
			} else {
				const dateSplit = params['d'].split('-');
				if (dateSplit.length === 3) {
					const date = new Date(dateSplit[0], dateSplit[1] - 1, dateSplit[2]);
					if (isNaN(date.getTime())) {
						this.updateToToday();
					} else {
						this.selectedDate$$.next(date);
						this.newDate$$.next({ date, isWeekChange: false });
						this.dateControl.setValue(date);
						this.datepicker.activeDate = date;
					}
				} else {
					this.updateQuery('m', this.selectedDate$$.value, true);
				}
			}
			setTimeout(() => {
				if (!params['v']) {
					this.calendarViewFormControl.setValue('week', { onlySelf: true, emitEvent: false });
				} else {
					this.calendarViewFormControl.setValue(this.paramsToCalendarView[params['v']], { onlySelf: true, emitEvent: false });
				}
			}, 0);
		});

		this.calendarViewFormControl.valueChanges
			.pipe(
				filter((v) => !!v),
				takeUntil(this.destroy$$),
			)
			.subscribe((value) => {
				this.updateQuery(value[0]);
			});

		this.priorityApiSvc.prioritySlots$.pipe(takeUntil(this.destroy$$)).subscribe((prioritySlots) => {
			this.setPrioritySlots(prioritySlots?.data);
		});

		this.practiceHoursApiSvc.practiceHours$.pipe(takeUntil(this.destroy$$)).subscribe((practiceHours) => {
			this.createTimeInterval(practiceHours);
			const value = [...practiceHours];
			let minMaxValue = value.reduce((pre: any, curr) => {
				let finalValue = { ...pre };
				if (!pre?.min || !pre?.max) {
					finalValue = { min: curr.dayStart, max: curr.dayEnd };
					return finalValue;
				}
				if (DateTimeUtils.TimeToNumber(curr.dayStart) <= DateTimeUtils.TimeToNumber(pre?.min)) {
					finalValue = { ...finalValue, min: curr.dayStart };
				}
				if (DateTimeUtils.TimeToNumber(curr.dayEnd) >= DateTimeUtils.TimeToNumber(pre?.max)) {
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
		});

		this.appointmentData$ = this.weekdayToPractice$$.pipe(
			filter(Boolean),
			switchMap(() => {
				return this.route.queryParams;
			}),
			filter((queryParams) => !!queryParams['v'] && !!queryParams['d']),
			distinctUntilChanged(this.distinctUntilChanged),
			map(this.getFromAndToDate.bind(this)),
			debounceTime(100),
			switchMap(({ fromDate, toDate }) => {
				this.loaderSvc.dataLoading(true);
				return this.appointmentApiSvc.appointmentForCalendar$(fromDate, toDate).pipe(
					catchError((err) => {
						this.loaderSvc.dataLoading(false);
						return throwError(() => err);
					}),
				);
			}),
			map((data) => data.data),
			takeUntil(this.destroy$$),
		);

		this.appointmentDataForDayView$ = this.appointmentData$.pipe(map(this.dataModificationForDayView.bind(this)));

		this.appointmentDataForWeekView$ = this.appointmentData$.pipe(map(this.dataModificationForWeekView.bind(this)));

		this.appointmentDataForMonthView$ = this.appointmentData$.pipe(map(this.dataModificationForMonthView.bind(this)));

		this.roomApiSvc.allRooms$.pipe(takeUntil(this.destroy$$)).subscribe((rooms) => {
			this.headerList = rooms.map(({ name, id }) => ({ name, value: id }));
		});

		this.dateControl.valueChanges.pipe(takeUntil(this.destroy$$)).subscribe((value) => {
			const date = new Date(value);
			this.updateDate(date);
			this.newDate$$.next({ date, isWeekChange: false });
		});

		combineLatest([this.weekdayToPractice$$, this.route.queryParams, this.calendarViewFormControl.valueChanges])
			.pipe(
				filter(([weekdayToPractice]) => this.calendarViewFormControl.value === 'day' && weekdayToPractice),
				takeUntil(this.destroy$$),
			)
			.subscribe(([_, queryParams]) => {
				// eslint-disable-line
				if (this.calendarViewFormControl.value === 'day' && !queryParams['d']) this.updateQuery('d', this.selectedDate$$.value);

				const value = new Date(queryParams['d']);
				const time = this.weekdayToPractice$$.value[value.getDay()];
				this.selectedSlot$$.next({
					...time,
					timings: time?.timings?.filter(
						(timing: any) => DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(timing)) > DateTimeUtils.TimeToNumber(timing),
					),
				});
			});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => {
				this.selectedLang = lang;
			});
	}

	public override ngOnDestroy() {
		this.loaderSvc.dataLoading(false);
		super.ngOnDestroy();
	}

	public updateDate(newDate: Date) {
		this.updateQuery('', newDate);
	}

	public setForm(event: FormControl<Date>) {
		this.dateControl = event;
		this.dateControl.setValue(this.selectedDate$$.value, { onlySelf: true, emitEvent: false });
		this.dateControl.valueChanges.pipe(takeUntil(this.destroy$$), distinctUntilChanged()).subscribe({
			next: (value) => {
				this.updateQuery('', value);
			},
		});
	}

	private distinctUntilChanged(preQueryParam, currQueryParam): boolean {
		if (preQueryParam['v'] !== currQueryParam['v']) return false;

		const [currYear, currMonth, currDay] = currQueryParam['d'].split('-');

		const [preYear, preMonth, preDay] = preQueryParam['d'].split('-');

		const currDate = new Date(currYear, currMonth - 1, currDay, 0, 0, 0, 0);

		const preDate = new Date(preYear, preMonth - 1, preDay, 0, 0, 0, 0);
		switch (true) {
			case currQueryParam['v'] === 'm':
				if (currMonth !== preMonth || currYear !== preYear) {
					return false;
				}
				return true;
			case currQueryParam['v'] === 'w': {
				if (currMonth !== preMonth || currYear !== preYear) {
					return false;
				}
				const firstDayOfPreWeek = new Date().setDate(preDate.getDate() - (preDate.getDay() ? preDate.getDay() : 7));

				const firstDayOfCurrWeek = new Date().setDate(currDate.getDate() - (currDate.getDay() ? currDate.getDay() : 7));

				if (firstDayOfPreWeek !== firstDayOfCurrWeek) {
					return false;
				}
				return true;
			}
			default:
				return false;
		}
	}

	private getFromAndToDate(queryParam) {
		this.isDayView$$.next(false);
		const [year, month, day] = queryParam['d'].split('-');

		const currDate = new Date(+year, +month - 1, +day, 0, 0, 0, 0);

		let fromDate: string;

		let toDate: string;
		switch (true) {
			case queryParam['v'] === 'm':
				fromDate = DateTimeUtils.DateDistributedToString(new Date(+year, +month - 1, 1), '-');

				toDate = DateTimeUtils.DateDistributedToString(new Date(+year, +month, 0), '-');

				return { fromDate, toDate };
			case queryParam['v'] === 'w':
				currDate.setDate(currDate.getDate() - (currDate.getDay() ? currDate.getDay() - 1 : 6));

				fromDate = DateTimeUtils.DateDistributedToString(currDate, '-');

				currDate.setDate(currDate.getDate() + 6);

				toDate = DateTimeUtils.DateDistributedToString(currDate, '-');

				return { fromDate, toDate };
			default: {
				const time = this.weekdayToPractice$$.value[currDate.getDay()];
				this.selectedSlot$$.next({
					...time,
					timings: time?.timings?.filter(
						(timing: any) => DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(timing)) > DateTimeUtils.TimeToNumber(timing),
					),
				});
				this.isDayView$$.next(true);
				return { fromDate: queryParam['d'], toDate: queryParam['d'] };
			}
		}
	}

	public changeDate(offset: number) {
		switch (this.calendarViewFormControl.value) {
			case 'day':
				this.changeDate$$.next(offset);
				break;
			case 'week':
				this.changeWeek$$.next(offset);
				break;
			case 'month':
				this.changeMonth$$.next(offset);
				break;
			default:
		}
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

	public changeToDayView(date: Date) {
		this.updateQuery('d', date);
	}

	public updateToToday() {
		this.updateQuery('', new Date());
	}

	private dataModificationForWeekView(appointments: Appointment[]): any {
		if (!appointments.length) {
			this.loaderSvc.dataLoading(false);
			return {};
		}

		let modifiedApplointments: Appointment[] = [];

		for (let appointment of appointments){
			if (!appointment.isCombineExam) {
				appointment.exams?.forEach((exam:Exam) => {
					modifiedApplointments.push({
						...appointment,
						startedAt: new Date(exam.startedAt),
						endedAt: new Date(exam.endedAt),
						roomsDetail: exam.rooms!,
						exams: [exam]
					})
				})
			} else {
				modifiedApplointments.push(appointment);
			}
		};

		appointments = [...modifiedApplointments];		
		appointments.sort((a: Appointment, b: Appointment) => this.getTimeOfDate(a.startedAt) - this.getTimeOfDate(b.startedAt));

		let apArray: Appointment[] = [];
		const dateArrays: Appointment[][] = [];
		const groupByDate = {};

		if (appointments[0].startedAt) {
			let currDate = appointments[0].startedAt?.getDate();
			appointments.forEach((ap: Appointment) => {
				if (currDate === ap.startedAt.getDate()) {
					apArray.push(ap);
				} else {
					dateArrays.push(...this.getDayGroups(apArray));
					apArray = [];
					apArray.push(ap);
					currDate = ap.startedAt.getDate();
				}
			});
			dateArrays.push(...this.getDayGroups(apArray));
	
			dateArrays.forEach((arr: Appointment[]) => {
				const dateString = this.datePipe.transform(new Date(arr[0].startedAt), 'd-M-yyyy');
	
				if (dateString && groupByDate[dateString]) {
					groupByDate[dateString] = [...groupByDate[dateString], this.makeGroup(arr)];
				} else if (dateString) {
					groupByDate[dateString] = [this.makeGroup(arr)];
				}
			});
		}

		this.loaderSvc.dataLoading(false);
		return groupByDate;
	}

	private getDayGroups(dayAppointments: Appointment[]): Appointment[][] {
		let max: number = this.getTimeOfDate(dayAppointments[0].endedAt);
		let tempArr: Appointment[] = [];
		const dayGroups: Appointment[][] = [];
		dayAppointments.push({} as Appointment);

		dayAppointments.forEach((ap: Appointment) => {
			let apStart = this.getTimeOfDate(ap.startedAt),
				apEnd = this.getTimeOfDate(ap.endedAt);
			if (apStart < max) {
				if (max < apEnd) max = apEnd;
				tempArr.push(ap);
			} else {
				dayGroups.push(tempArr);
				tempArr = [];
				tempArr.push(ap);
				max = this.getTimeOfDate(ap.endedAt);
			}
		});

		return dayGroups;
	}

	private makeGroup(appointments: Appointment[]): Appointment[][] {
		let daygroup: Appointment[][] = [];
		appointments.forEach((appointment: Appointment) => {
			if (appointment.exams?.length && appointment.startedAt) {
				if (!daygroup.length) {
					daygroup.push([appointment]);
				} else {
					let spaceExist = false;
					for (let i = 0; i < daygroup.length; i++) {
						daygroup[i].forEach((apmt: Appointment) => {
							spaceExist = this.getSpaceExist(spaceExist, apmt, appointment);
						});

						if (spaceExist) {
							daygroup[i] = [...daygroup[i], appointment];
							break;
						}
					}
					if (!spaceExist) daygroup.push([appointment]);
				}
			}
		});

		return daygroup;
	}

	private getTimeOfDate = (date: Date | string) => new Date(date).getTime();

	private getSpaceExist(spaceExist: boolean, apmt: Appointment, appointment: Appointment): boolean {
		if (this.getTimeOfDate(apmt.endedAt) <= this.getTimeOfDate(appointment.startedAt)) {
			spaceExist = true;
		} else if (spaceExist && this.getTimeOfDate(apmt.startedAt) >= this.getTimeOfDate(appointment.endedAt)) {
			spaceExist = true;
		} else {
			spaceExist = false;
		}

		return spaceExist;
	}

	private dataModificationForMonthView(appointments: Appointment[]) {
		const appointmentsGroupedByDate = {};
		appointments.forEach((appointment) => {
			if (Object.keys(appointment).length && appointment.exams?.length && appointment.startedAt) {
				const dateString = this.datePipe.transform(new Date(appointment.startedAt), 'd-M-yyyy');
				if (dateString) {
					if (!appointmentsGroupedByDate[dateString]) {
						appointmentsGroupedByDate[dateString] = [];
					}
					appointmentsGroupedByDate[dateString].push(appointment);
				}
			}
		});
		this.loaderSvc.dataLoading(false);
		return appointmentsGroupedByDate;
	}

	private dataModificationForDayView(appointmentsProps: Appointment[]) {
		const appointments: Appointment[] = [];
		const appointmentGroupedByDateAndRoom = {};
		appointmentsProps?.forEach((appointment: Appointment) => {
			appointment?.exams?.forEach((exam) => {
				exam?.rooms?.forEach((room: any) => {
					appointments.push({ ...appointment, startedAt: room.startedAt, endedAt: room.endedAt, exams: [{ ...exam, rooms: [room] }] });
				});
			});
		});

		appointments?.forEach((appointment) => {
			if (appointment?.startedAt) {
				const dateString = this.datePipe.transform(new Date(appointment.startedAt), 'd-M-yyyy');

				if (dateString) {
					if (!appointmentGroupedByDateAndRoom[dateString]) {
						appointmentGroupedByDateAndRoom[dateString] = {};
					}

					appointment?.exams?.forEach((exam) => {
						exam.rooms?.forEach((room) => {
							if (!appointmentGroupedByDateAndRoom[dateString][room.id]) {
								appointmentGroupedByDateAndRoom[dateString][room.id] = [];
							}

							appointmentGroupedByDateAndRoom[dateString][room.id].push({
								appointment,
								exams: appointment.exams ?? [],
							});
						});
					});
				}
			}
		});
		this.loaderSvc.dataLoading(false);
		return appointmentGroupedByDateAndRoom;
	}

	private updateQuery(queryStr?: string, date?: Date, replaceUrl: boolean = false) {
		setTimeout(() => {
			this.router.navigate([], {
				queryParams: {
					...(queryStr ? { v: queryStr } : {}),
					...(date ? { d: this.datePipe.transform(date, 'yyyy-MM-dd') } : {}),
				},
				queryParamsHandling: 'merge',
				replaceUrl,
			});
		}, 0);
	}

	private createTimeInterval(practiceHours: PracticeAvailabilityServer[]) {
		practiceHours.sort(
			(p1, p2) =>
				DateTimeUtils.TimeToNumber(DateTimeUtils.TimeStringIn24Hour(p1.dayStart)) -
				DateTimeUtils.TimeToNumber(DateTimeUtils.TimeStringIn24Hour(p2.dayStart)),
		);

		const weekdayToPractice = {};

		practiceHours.forEach((p) => {
			if (!weekdayToPractice[p.weekday]) {
				weekdayToPractice[p.weekday] = { timings: [], intervals: [] };
			}

			weekdayToPractice[p.weekday].intervals.push({
				dayStart: DateTimeUtils.TimeStringIn24Hour(p.dayStart),
				dayEnd: DateTimeUtils.TimeStringIn24Hour(p.dayEnd),
			});
		});

		getNumberArray(6, 0).forEach((weekday) => {
			const practiceData = weekdayToPractice[weekday];

			if (practiceData?.intervals?.length) {
				const startTime = practiceData.intervals[0].dayStart;
				const endTime = practiceData.intervals[practiceData.intervals.length - 1].dayEnd;

				let startMinutes = DateTimeUtils.DurationInMinFromHour(+startTime.split(':')[0], +startTime.split(':')[1]);
				let endMinutes = DateTimeUtils.DurationInMinFromHour(+endTime.split(':')[0], +endTime.split(':')[1]);

				if (startMinutes - 120 > 0) {
					startMinutes -= 120;
				} else {
					startMinutes = 0;
				}

				if (endMinutes + 120 < 24 * 60) {
					endMinutes += 120;
				} else {
					endMinutes = 24 * 60;
				}

				const timings = this.timeIntervalPipe.transform(15, true, false, startMinutes, endMinutes);

				weekdayToPractice[weekday].timings = [...timings];
			}
		});

		this.weekdayToPractice$$.next(weekdayToPractice);
	}

	public async addAppointment(event: any) {
		if (this.permissionSvc.permissionType === UserRoleEnum.Reader) {
			return;
		}

		const { e, eventsContainer, day, isOutside, appointment } = event;

		const currentDate = new Date();

		let minutes = Math.round(+e.offsetY / this.pixelPerMinute);

		// In case if calendar start time is not 00:00 then adding extra minutes

		if (this.practiceHourMinMax$$.value) {
			minutes += getDurationMinutes(DateTimeUtils.timeStingToDate('00:00:00'), DateTimeUtils.timeStingToDate(this.practiceHourMinMax$$.value.min));
		}

		const roundedMin = minutes - (minutes % 5);
		const hour = Math.floor(minutes / 60);
		const min = roundedMin % 60;
		const currentSelectedTime = new Date(this.selectedDate$$.value.getFullYear(), day[1], day[0]);
		currentSelectedTime.setHours(hour);
		currentSelectedTime.setMinutes(min);
		const currentTimeInLocal = DateTimeUtils.UTCDateToLocalDate(currentSelectedTime);

		if (currentTimeInLocal.getTime() < currentDate.getTime()) {
			this.notificationSvc.showWarning(Translate.CanNotAddAppointmentOnPastDate[this.selectedLang]);
			this.draggableSvc.revertDrag();
			return;
		}
		if (isOutside) {
			const appointmentId = appointment?.id;
			const res = await firstValueFrom(
				this.modalSvc.open(ConfirmActionModalComponent, {
					data: {
						titleText: appointmentId ? 'EditAppointmentConfirmation' : 'AddAppointmentConfirmation',
						bodyText: 'AreYouSureWantToMakeAppointmentOutsideOperatingHours',
						confirmButtonText: 'Yes',
					} as ConfirmActionModalData,
					options: {
						backdrop: false,
						centered: true,
					},
				}).closed,
			);

			if (!res) {
				this.draggableSvc.revertDrag();
				return;
			}
		}

		if (appointment?.id && !isOutside) {
			const date = `${this.selectedDate$$.value.getFullYear()}-${day[1] + 1}-${day[0]}`;
			const reqData: AppointmentSlotsRequestData = {
				fromDate: date,
				toDate: date,
				date,
				exams: appointment?.exams?.map(({ id }) => `${id}`),
				AppointmentId: appointment?.id,
			};
			const isSlotAvailable = await firstValueFrom(this.appointmentApiSvc.getSlots$(reqData).pipe(map((data) => !!data?.[0]?.slots?.length)));
			if (!isSlotAvailable) {
				this.notificationSvc.showWarning(Translate.NoSlotAvailable[this.selectedLang]);
				this.draggableSvc.revertDrag();
				return;
			}
		}

		const eventCard: HTMLDivElement | undefined = eventsContainer ? this.createAppointmentCard(e, eventsContainer) : undefined;

		this.modalSvc
			.open(AddAppointmentModalComponent, {
				data: {
					event: e,
					element: eventCard,
					elementContainer: eventsContainer,
					startedAt: new Date(this.selectedDate$$.value.getFullYear(), day[1], day[0]),
					limit: this.practiceHourMinMax$$.value,
					isOutside,
					appointment,
				},
				options: {
					size: 'xl',
					backdrop: false,
					centered: true,
					modalDialogClass: 'ad-ap-modal-shadow',
				},
			})
			.closed.pipe(take(1))
			.subscribe({
				next: (value) => {
					this.draggableSvc.revertDrag(!!value);
					eventCard?.remove();
				},
			});
	}

	private createAppointmentCard(e: MouseEvent, eventsContainer: HTMLDivElement): HTMLDivElement {
		const top = e.offsetY - (e.offsetY % 20);
		const eventCard = document.createElement('div');
		eventCard.classList.add('calendar-week-view-event-container');
		eventCard.style.height = `20px`;
		eventCard.style.top = `${top}px`;

		const appointmentText = document.createElement('span');

		appointmentText.innerText = this.translate.instant('Appointment');

		appointmentText.classList.add('appointment-title');

		eventCard.appendChild(appointmentText);
		eventsContainer.appendChild(eventCard);

		return eventCard;
	}

	private setPrioritySlots(prioritySlots: PrioritySlot[]) {
		const myPrioritySlots = {};
		prioritySlots
			.map((value) => ({
				...value,
				startedAt: value.startedAt,
				endedAt: value.endedAt,
				slotStartTime: this.utcToLocalPipe.transform(value.slotStartTime, true),
				slotEndTime: this.utcToLocalPipe.transform(value.slotEndTime, true),
			}))
			.forEach((prioritySlot: PrioritySlot) => {
				let { repeatFrequency } = prioritySlot;
				const { priority, nxtSlotOpenPct, id, isClose, startedAt, endedAt } = prioritySlot;
				const startDate = new Date(new Date(DateTimeUtils.UTCDateToLocalDate(new Date(prioritySlot.startedAt), true)).toDateString());
				let firstDate = new Date(new Date(DateTimeUtils.UTCDateToLocalDate(new Date(prioritySlot.startedAt), true)).toDateString());
				const lastDate = new Date(
					new Date(DateTimeUtils.UTCDateToLocalDate(new Date(prioritySlot.endedAt ? prioritySlot.endedAt : new Date()), true)).toDateString(),
				);
				switch (true) {
					case !prioritySlot.isRepeat:
					case prioritySlot.repeatType === RepeatType.Daily: {
						repeatFrequency = prioritySlot.isRepeat ? repeatFrequency : 1;
						while (true) {
							if (firstDate.getTime() > lastDate.getTime()) break;
							const dateString = this.datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
							const customPrioritySlot = {
								start: prioritySlot.slotStartTime.slice(0, 5),
								end: prioritySlot.slotEndTime?.slice(0, 5),
								priority,
								nxtSlotOpenPct,
								id,
								isClose,
								startedAt,
								endedAt,
							};
							myPrioritySlots[dateString] = myPrioritySlots[dateString] ? [...myPrioritySlots[dateString], customPrioritySlot] : [customPrioritySlot];
							firstDate.setDate(firstDate.getDate() + repeatFrequency);
						}
						break;
					}
					case prioritySlot.repeatType === RepeatType.Weekly: {
						const closestSunday = new Date(startDate.getTime() - startDate.getDay() * 24 * 60 * 60 * 1000);
						firstDate = new Date(closestSunday);
						while (true) {
							prioritySlot.repeatDays.split(',').forEach((day) => {
								firstDate.setTime(closestSunday.getTime());
								firstDate.setDate(closestSunday.getDate() + +day);
								if (firstDate.getTime() >= startDate.getTime() && firstDate.getTime() <= lastDate.getTime()) {
									const dateString = this.datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
									const customPrioritySlot = {
										start: prioritySlot.slotStartTime.slice(0, 5),
										end: prioritySlot.slotEndTime?.slice(0, 5),
										priority,
										nxtSlotOpenPct,
										id,
										isClose,
										startedAt,
										endedAt,
									};
									myPrioritySlots[dateString] = myPrioritySlots[dateString]
										? [...myPrioritySlots[dateString], customPrioritySlot]
										: [customPrioritySlot];
								}
							});
							if (closestSunday.getTime() >= lastDate.getTime()) break;
							closestSunday.setDate(closestSunday.getDate() + repeatFrequency * 7);
						}
						break;
					}
					case prioritySlot.repeatType === RepeatType.Monthly: {
						while (true) {
							prioritySlot.repeatDays.split(',').forEach((day) => {
								if (getDateOfMonth(firstDate.getFullYear(), firstDate.getMonth() + 1, 0) >= +day) {
									firstDate.setDate(+day);
									if (firstDate.getTime() >= startDate.getTime() && firstDate.getTime() <= lastDate.getTime()) {
										const dateString = this.datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
										const customPrioritySlot = {
											start: prioritySlot.slotStartTime.slice(0, 5),
											end: prioritySlot.slotEndTime?.slice(0, 5),
											priority,
											nxtSlotOpenPct,
											id,
											isClose,
											startedAt,
											endedAt,
										};
										myPrioritySlots[dateString] = myPrioritySlots[dateString]
											? [...myPrioritySlots[dateString], customPrioritySlot]
											: [customPrioritySlot];
									}
								}
							});
							if (firstDate.getTime() >= lastDate.getTime()) break;
							firstDate.setMonth(firstDate.getMonth() + repeatFrequency);
						}
						break;
					}
					default:
						break;
				}
			});

		this.prioritySlots$$.next({ ...myPrioritySlots });
	}

	public updateFormDate(value: any) {
		this.dateControl.setValue(value);
	}
}
