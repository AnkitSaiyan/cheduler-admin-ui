import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	of,
	skip,
	startWith,
	switchMap,
	takeUntil,
	tap,
} from 'rxjs';
import { AbsenceApiService } from 'src/app/core/services/absence-api.service';
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';
import { PracticeHoursApiService } from 'src/app/core/services/practice-hours-api.service';
import { RoomsApiService } from 'src/app/core/services/rooms-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { NameValue } from 'src/app/shared/components/search-modal.component';
import { Absence, RepeatType } from 'src/app/shared/models/absence.model';
import { getDateOfMonth, getDurationMinutes } from 'src/app/shared/models/calendar.model';
import { PracticeAvailabilityServer } from 'src/app/shared/models/practice.model';
import { TimeInIntervalPipe } from 'src/app/shared/pipes/time-in-interval.pipe';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { ABSENCE_TYPE, ABSENCE_TYPE_ARRAY } from 'src/app/shared/utils/const';
import { DateTimeUtils } from 'src/app/shared/utils/date-time.utils';
import { getNumberArray } from 'src/app/shared/utils/getNumberArray';

@Component({
	selector: 'dfm-absence-calendar-view',
	templateUrl: './absence-calendar-view.component.html',
	styleUrls: ['./absence-calendar-view.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbsenceCalendarViewComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public calendarViewFormControl = new FormControl('month', []);

	public dataControl = new FormControl();

	public calendarViewType: NameValue[] = [];

	public headerList: NameValue[] = [];

	public selectedDate$$ = new BehaviorSubject<Date>(new Date());

	public today$$ = new BehaviorSubject(new Date());

	public changeMonth$$ = new BehaviorSubject<number>(0);

	public changeWeek$$ = new BehaviorSubject<number>(0);

	public changeDate$$ = new BehaviorSubject<number>(0);

	public newDate$$ = new BehaviorSubject<{ date: Date | null; isWeekChange: boolean }>({ date: null, isWeekChange: false });

	public selectedSlot$$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

	public weekdayToPractice$$ = new BehaviorSubject<any>(null);

	public practiceHourMinMax$$ = new BehaviorSubject<{ min: string; max: string; grayOutMin: string; grayOutMax: string } | null>(null);

	public absenceData$!: Observable<any>;

	public absenceDayViewData$!: Observable<any>;

	public absenceWeekViewData$!: Observable<any>;

	public absenceMonthViewData$!: Observable<any>;

	private isDayView$$ = new BehaviorSubject<boolean>(false);

	public todayEvent$$ = new BehaviorSubject<any[]>([]);

	public absenceType$!: Observable<(typeof ABSENCE_TYPE_ARRAY)[number]>;

	public ABSENCE_TYPE_ARRAY = ABSENCE_TYPE_ARRAY;

	@ViewChild('sidePanel') sidePanel!: ElementRef;

	@Output()
	private dateChange: EventEmitter<Date> = new EventEmitter();

	private paramsToCalendarView = {
		m: 'month',
		w: 'week',
		d: 'day',
	};

	private calendarViewToParam = {
		month: 'm',
		week: 'w',
		day: 'd',
	};

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private datePipe: DatePipe,
		private appointmentApiSvc: AppointmentApiService,
		private absenceApiSvc: AbsenceApiService,
		private roomApiSvc: RoomsApiService,
		private timeIntervalPipe: TimeInIntervalPipe,
		private practiceHoursApiSvc: PracticeHoursApiService,
		private utcToLocalPipe: UtcToLocalPipe,
	) {
		super();
		this.appointmentApiSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				this.calendarViewType = items;
			},
		});
	}

	ngOnInit() {
		combineLatest([this.route.queryParams, this.route.data])
			.pipe(takeUntil(this.destroy$$))
			.subscribe(([params, data]) => {
				if (!params['d']) {
					this.updateQuery('m', this.selectedDate$$.value, true);
				} else {
					const dateSplit = params['d'].split('-');
					if (dateSplit.length === 3) {
						const date = new Date(dateSplit[0], dateSplit[1] - 1, dateSplit[2]);
						if (isNaN(date.getTime())) {
							this.updateToToday();
						} else {
							this.selectedDate$$.next(date);
							this.emitDate(date);
							this.newDate$$.next({ date, isWeekChange: false });
						}
					} else {
						this.updateQuery('m', this.selectedDate$$.value, true);
					}
				}
				setTimeout(() => {
					if (!params['v'] || data?.['absenceType'] === ABSENCE_TYPE_ARRAY[2]) {
						this.calendarViewFormControl.setValue('month', { onlySelf: true, emitEvent: false });
					} else {
						this.calendarViewFormControl.setValue(this.paramsToCalendarView[params['v']], { onlySelf: true, emitEvent: false });
					}
				}, 0);
			});

		this.absenceType$ = this.route.data.pipe(
			filter((data) => !!data[ABSENCE_TYPE]),
			map((data) => data[ABSENCE_TYPE]),
		);

		this.calendarViewFormControl.valueChanges.pipe(filter(Boolean), skip(1), takeUntil(this.destroy$$)).subscribe({
			next: (value) => {
				this.updateQuery(this.calendarViewToParam[value]);
			},
		});

		this.practiceHoursApiSvc.practiceHours$.pipe(takeUntil(this.destroy$$)).subscribe((practiceHours) => {
			this.createTimeInterval(practiceHours);
			this.calculateMinMaxLimit([...practiceHours]);
		});

		combineLatest([this.route.data, this.route.queryParams])
			.pipe(
				filter(([data, queryParams]: [Params, Params]) => data[ABSENCE_TYPE] === ABSENCE_TYPE_ARRAY[0] && queryParams['v'] === 'd'),
				distinctUntilChanged(([preParams, preQueryParam], [currParams, currQueryParam]) => {
					return !(preParams[ABSENCE_TYPE] !== currParams[ABSENCE_TYPE] || preQueryParam['v'] !== currQueryParam['v']);
				}),
				debounceTime(100),
				switchMap(() => this.roomApiSvc.allRooms$),
				takeUntil(this.destroy$$),
			)
			.subscribe((rooms) => {
				this.headerList = rooms.map(({ name, id }) => ({ name, value: id }));
			});

		this.absenceData$ = this.weekdayToPractice$$.pipe(
			filter(Boolean),
			switchMap(() => combineLatest([this.route.data, this.route.queryParams])),
			filter(
				([data, queryParams]: [Params, Params]) =>
					!!data[ABSENCE_TYPE] && data[ABSENCE_TYPE] !== ABSENCE_TYPE_ARRAY[2] && !!queryParams['v'] && !!queryParams['d'],
			),
			distinctUntilChanged(this.distinctUntilChanged),
			tap(([data, queryParams]: [Params, Params]) => {
				if (data[ABSENCE_TYPE] === ABSENCE_TYPE_ARRAY[1] && queryParams['v'] === 'd') {
					this.headerList = [];
				}
			}),
			map(this.getFromAndToDate.bind(this)),
			debounceTime(100),
			switchMap(([absenceType, { fromDate, toDate }]) => {
				return this.absenceApiSvc.absencesForCalendar$(absenceType, fromDate, toDate);
			}),
			map((data) => data.data),
			map(this.dataModification.bind(this)),
			takeUntil(this.destroy$$),
		);

		this.absenceDayViewData$ = this.absenceData$.pipe(
			map(this.dataModificationForDay.bind(this)),
			tap((dayViewAbsenceSlot) => {
				if (!this.headerList.length) {
					this.headerList = Object.keys(dayViewAbsenceSlot)
						.filter((name) => name !== 'undefined')
						.map((name) => ({ name, value: name }));
				}
			}),
		);

		this.absenceWeekViewData$ = this.absenceData$.pipe(map(this.dataModificationForWeek.bind(this)));

		this.absenceMonthViewData$ = this.absenceData$.pipe(map(this.dataModificationForMonth));
	}

	public override ngOnDestroy(): void {
		super.ngOnDestroy();
	}

	private distinctUntilChanged([preParams, preQueryParam], [currParams, currQueryParam]): boolean {
		if (preParams[ABSENCE_TYPE] !== currParams[ABSENCE_TYPE]) return false;

		if (preQueryParam.v !== currQueryParam.v) return false;

		const [currYear, currMonth, currDay] = currQueryParam.d.split('-');

		const [preYear, preMonth, preDay] = preQueryParam.d.split('-');

		const currDate = new Date(currYear, currMonth - 1, currDay, 0, 0, 0, 0);

		const preDate = new Date(preYear, preMonth - 1, preDay, 0, 0, 0, 0);

		switch (true) {
			case currQueryParam.v === 'm':
				if (currMonth !== preMonth || currYear !== preYear) {
					return false;
				}
				return true;
			case currQueryParam.v === 'w': {
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

	private getFromAndToDate([data, queryParam]) {
		this.isDayView$$.next(false);
		const [year, month, day] = queryParam.d.split('-');

		const currDate = new Date(+year, +month - 1, +day, 0, 0, 0, 0);

		let fromDate: string;

		let toDate: string;
		switch (true) {
			case queryParam.v === 'm':
				fromDate = DateTimeUtils.DateDistributedToString(new Date(+year, +month - 1, 1), '-');

				toDate = DateTimeUtils.DateDistributedToString(new Date(+year, +month, 0), '-');

				return [data[ABSENCE_TYPE], { fromDate, toDate }];
			case queryParam.v === 'w':
				currDate.setDate(currDate.getDate() - (currDate.getDay() ? currDate.getDay() - 1 : 6));

				fromDate = DateTimeUtils.DateDistributedToString(currDate, '-');

				currDate.setDate(currDate.getDate() + 6);

				toDate = DateTimeUtils.DateDistributedToString(currDate, '-');

				return [data[ABSENCE_TYPE], { fromDate, toDate }];
			default: {
				const time = this.weekdayToPractice$$.value[currDate.getDay()];
				this.selectedSlot$$.next({
					...time,
					timings: time?.timings?.filter(
						(timing: any) => DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(timing)) > DateTimeUtils.TimeToNumber(timing),
					),
				});
				this.isDayView$$.next(true);
				return [data[ABSENCE_TYPE], { fromDate: queryParam.d, toDate: queryParam.d }];
			}
		}
	}

	private dataModification(absenceData) {
		const absenceSlot = {};
		absenceData
			?.map((value) => ({
				...value,
				startedAt: value.startedAt,
				endedAt: value.endedAt,
				slotStartTime: this.utcToLocalPipe.transform(this.datePipe.transform(value.startedAt, 'HH:mm:ss'), true),
				slotEndTime: this.utcToLocalPipe.transform(this.datePipe.transform(value.endedAt, 'HH:mm:ss'), true),
				isHoliday: value.isHoliday,
			}))
			?.forEach((absence: any) => {
				let { repeatFrequency } = absence;
				const { absenceId, name, info, startedAt, endedAt, roomName, userName, isHoliday, impactedAppointmentDetails } = absence;
				const startDate = new Date(new Date(DateTimeUtils.UTCDateToLocalDate(new Date(absence.startedAt), true)).toDateString());
				let firstDate = new Date(new Date(DateTimeUtils.UTCDateToLocalDate(new Date(absence.startedAt), true)).toDateString());
				const lastDate = new Date(new Date(DateTimeUtils.UTCDateToLocalDate(new Date(absence.endedAt), true)).toDateString());
				switch (true) {
					case !absence.isRepeat:
					case absence.repeatType === RepeatType.Daily: {
						repeatFrequency = absence.isRepeat ? repeatFrequency : 1;
						while (true) {
							if (firstDate.getTime() > lastDate.getTime()) break;
							const dateString = this.datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
							const customPrioritySlot = {
								start: absence.slotStartTime.slice(0, 5),
								end: absence.slotEndTime?.slice(0, 5),
								id: absenceId,
								name,
								info,
								startedAt,
								endedAt,
								roomName,
								userName,
								isHoliday,
								impactedAppointmentDetails,
							};
							absenceSlot[dateString] = absenceSlot[dateString] ? [...absenceSlot[dateString], customPrioritySlot] : [customPrioritySlot];
							firstDate.setDate(firstDate.getDate() + repeatFrequency);
						}
						break;
					}
					case absence.repeatType === RepeatType.Weekly: {
						const closestSunday = new Date(startDate.getTime() - startDate.getDay() * 24 * 60 * 60 * 1000);
						firstDate = new Date(closestSunday);
						while (true) {
							absence.repeatDays.split(',').forEach((day) => {
								firstDate.setTime(closestSunday.getTime());
								firstDate.setDate(closestSunday.getDate() + +day);
								if (firstDate.getTime() >= startDate.getTime() && firstDate.getTime() <= lastDate.getTime()) {
									const dateString = this.datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
									const customPrioritySlot = {
										start: absence.slotStartTime.slice(0, 5),
										end: absence.slotEndTime?.slice(0, 5),
										id: absenceId,
										name,
										info,
										startedAt,
										endedAt,
										roomName,
										userName,
										isHoliday,
										impactedAppointmentDetails,
									};
									absenceSlot[dateString] = absenceSlot[dateString] ? [...absenceSlot[dateString], customPrioritySlot] : [customPrioritySlot];
								}
							});
							if (closestSunday.getTime() >= lastDate.getTime()) break;
							closestSunday.setDate(closestSunday.getDate() + repeatFrequency * 7);
						}
						break;
					}
					case absence.repeatType === RepeatType.Monthly: {
						while (true) {
							absence.repeatDays.split(',').forEach((day) => {
								if (getDateOfMonth(firstDate.getFullYear(), firstDate.getMonth() + 1, 0) >= +day) {
									firstDate.setDate(+day);
									if (firstDate.getTime() >= startDate.getTime() && firstDate.getTime() <= lastDate.getTime()) {
										const dateString = this.datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
										const customPrioritySlot = {
											start: absence.slotStartTime.slice(0, 5),
											end: absence.slotEndTime?.slice(0, 5),
											id: absenceId,
											name,
											info,
											startedAt,
											endedAt,
											roomName,
											userName,
											isHoliday,
											impactedAppointmentDetails,
										};
										absenceSlot[dateString] = absenceSlot[dateString] ? [...absenceSlot[dateString], customPrioritySlot] : [customPrioritySlot];
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
		return absenceSlot;
	}

	private dataModificationForDay(absenceSlot: { [key: string]: Absence[] }) {
		return (
			absenceSlot?.[this.datePipe.transform(this.selectedDate$$.value, 'd-M-yyyy')!]?.reduce((acc, item) => {
				const key = (item?.roomName ?? item?.userName)!;
				if (acc[key]) {
					acc[key] = [...acc[key], item];
				} else {
					acc[key] = [item];
				}
				return acc;
			}, {}) ?? {}
		);
	}

	private dataModificationForWeek(absenceSlot: { [key: string]: Absence[] }) {
		let startDate: string;
		let endDate: string;
		let sameGroup: boolean;
		const absenceGroupedByDate = {};
		const modifiedAbsence = {};
		Object.entries(absenceSlot).forEach(([key, absence]: [string, any]) => {
			const filterAbsence = {};
			const name = absence?.[0].userName ? 'userName' : 'roomName';
			absence.forEach((item) => {
				if (filterAbsence?.[item.id]) {
					filterAbsence[item.id] = { ...filterAbsence[item.id], [name]: `${filterAbsence[item.id][name]}, ${item[name]}` };
				} else {
					filterAbsence[item.id] = item;
				}
			});
			modifiedAbsence[key] = Object.values(filterAbsence);
		});
		Object.entries(modifiedAbsence).forEach(([key, absence]: [string, any]) => {
			let groupedAbsence: any[] = [];
			absence
				.sort((s1, s2) => (DateTimeUtils.TimeToNumber(s1.start) > DateTimeUtils.TimeToNumber(s2.start) ? 1 : -1))
				.forEach((item: any, index) => {
					const dateString = key;
					if (!absenceGroupedByDate[dateString]) {
						absenceGroupedByDate[dateString] = [];
						startDate = item.start;
						endDate = item.end;
						sameGroup = false;
					} else {
						const currSD = item.start;
						const currED = item.end;

						const endTime = new Date();
						endTime.setHours(+endDate.split(':')[0]);
						endTime.setMinutes(+endDate.split(':')[1]);

						const currSDTime = new Date();
						currSDTime.setHours(+currSD.split(':')[0]);
						currSDTime.setMinutes(+currSD.split(':')[1]);

						if (
							(DateTimeUtils.TimeToNumber(currSD) >= DateTimeUtils.TimeToNumber(startDate) &&
								DateTimeUtils.TimeToNumber(currSD) <= DateTimeUtils.TimeToNumber(endDate)) ||
							(DateTimeUtils.TimeToNumber(currSD) > DateTimeUtils.TimeToNumber(endDate) && getDurationMinutes(endTime, currSDTime) <= 1)
						) {
							sameGroup = true;
							if (DateTimeUtils.TimeToNumber(currED) > DateTimeUtils.TimeToNumber(endDate)) {
								endDate = currED;
							}
						} else {
							startDate = currSD;
							endDate = currED;
							sameGroup = false;
						}
					}

					if (!sameGroup) {
						if (index !== 0) {
							groupedAbsence = [];
						}
						absenceGroupedByDate[dateString].push(groupedAbsence);
					}
					groupedAbsence.push(item);
				});
		});
		return absenceGroupedByDate;
	}

	private dataModificationForMonth(absenceSlot: { [key: string]: Absence[] }) {
		const modifiedAbsence = {};
		Object.entries(absenceSlot).forEach(([key, absence]: [string, any]) => {
			const filterAbsence = {};
			const name = absence?.[0].userName ? 'userName' : 'roomName';
			absence.forEach((item) => {
				if (filterAbsence?.[item.id]) {
					filterAbsence[item.id] = { ...filterAbsence[item.id], [name]: `${filterAbsence[item.id][name]}, ${item[name]}` };
				} else {
					filterAbsence[item.id] = item;
				}
			});
			modifiedAbsence[key] = Object.values(filterAbsence);
		});
		return modifiedAbsence;
	}

	public setForm(event: FormControl<Date>) {
		this.dataControl = event;
		this.dataControl.setValue(this.selectedDate$$.value, { onlySelf: true, emitEvent: false });
		this.dataControl.valueChanges.pipe(takeUntil(this.destroy$$), distinctUntilChanged()).subscribe({
			next: (value) => {
				this.updateQuery('', value);
			},
		});
	}

	public setEventForm(event: FormControl<Date>) {
		event.valueChanges
			.pipe(
				startWith(new Date()),
				switchMap((date) => combineLatest([this.route.data, of(date)])),
				filter(([routeData]) => !!routeData[ABSENCE_TYPE]),
				map(([date, routeData]) => [date, routeData[ABSENCE_TYPE]]),
				switchMap(([date, absenceType]) =>
					this.absenceApiSvc.absencesForCalendar$(
						absenceType,
						this.datePipe.transform(new Date(date), 'yyyy-M-d')!,
						this.datePipe.transform(new Date(date), 'yyyy-M-d')!,
					),
				),
				map((data) => data.data),
				map(this.dataModification.bind(this)),
				map((absenceSlot) => absenceSlot[this.datePipe.transform(new Date(event.value ?? new Date()), 'd-M-yyyy')!] ?? []),
			)
			.subscribe((data) => this.todayEvent$$.next(data));
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

	public updateToToday() {
		this.updateQuery('', new Date());
	}

	public changeToDayView(date: Date) {
		this.updateQuery('d', date);
	}

	public updateDate(newDate: Date) {
		this.updateQuery('', newDate);
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

	private createTimeInterval(practiceHours: PracticeAvailabilityServer[]) {
		const weekdayToPractice = {};
		practiceHours.sort(
			(p1, p2) =>
				DateTimeUtils.TimeToNumber(DateTimeUtils.TimeStringIn24Hour(p1.dayStart)) -
				DateTimeUtils.TimeToNumber(DateTimeUtils.TimeStringIn24Hour(p2.dayStart)),
		);

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

			if (practiceData?.intervals.length) {
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

	private calculateMinMaxLimit(value: PracticeAvailabilityServer[]) {
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
	}

	public sidePanelViewToggle() {
		this.sidePanel.nativeElement.classList.toggle('side-panel-hide');
	}

	private emitDate(date: Date) {
		this.dateChange.emit(date);
	}
}
