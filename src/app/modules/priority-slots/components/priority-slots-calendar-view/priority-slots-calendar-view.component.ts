import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, combineLatest, debounceTime, filter, map, mergeMap, Observable, of, switchMap, take, takeUntil, tap } from 'rxjs';
import { PracticeHoursApiService } from 'src/app/core/services/practice-hours-api.service';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { RepeatType } from 'src/app/shared/models/absence.model';
import { getDateOfMonth } from 'src/app/shared/models/calendar.model';
import { NextSlotOpenPercentageData, PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { CustomDateParserFormatter } from '../../../../shared/utils/dateFormat';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { SignalrService } from 'src/app/core/services/signalr.service';
import { merge } from 'chart.js/dist/helpers/helpers.core';

@Component({
	selector: 'dfm-priority-slots-calendar-view',
	templateUrl: './priority-slots-calendar-view.component.html',
	styleUrls: ['./priority-slots-calendar-view.component.scss'],
	providers: [{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }],
})
export class PrioritySlotsCalendarViewComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public selectedDate$$: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());

	public dataControl = new FormControl();

	public changeWeek$$ = new BehaviorSubject<number>(0);

	public newDate$$ = new BehaviorSubject<{ date: Date | null; isWeekChange: boolean }>({ date: null, isWeekChange: false });

	public prioritySlots$$: BehaviorSubject<any>;

	public prioritySlotsCloseOpen$$: BehaviorSubject<any>;

	public slotPercentage$$: BehaviorSubject<any[]>;

	private dates$$ = new BehaviorSubject<string[]>([]);

	public practiceHourMinMax$: Observable<{ min: string; max: string; grayOutMin: string; grayOutMax: string } | null> = of(null);

	private currentSlotPercentageData: any[] = [];

	private currentDays!: any;

	constructor(
		private router: Router,
		private datePipe: DatePipe,
		private priorityApiSvc: PrioritySlotApiService,
		private practiceHourSvc: PracticeHoursApiService,
		private utcToLocalPipe: UtcToLocalPipe,
		private signalRService: SignalrService,
	) {
		super();
		this.prioritySlots$$ = new BehaviorSubject<any>({});
		this.prioritySlotsCloseOpen$$ = new BehaviorSubject<any>({});
		this.slotPercentage$$ = new BehaviorSubject<any[]>([]);
	}

	public appointmentsGroupedByDateAndTIme: { [key: string]: any[][] } = {};

	ngOnInit() {
		this.dataControl.valueChanges.pipe(takeUntil(this.destroy$$)).subscribe((value: any) => {
			const date = new Date(value);
			this.updateDate(date, true);
			this.newDate$$.next({ date, isWeekChange: true });
		});

		this.priorityApiSvc.prioritySlots$.pipe(takeUntil(this.destroy$$)).subscribe((prioritySlots) => {
			this.setPrioritySlots(prioritySlots?.data);
		});

		this.practiceHourMinMax$ = this.practiceHourSvc.practiceHours$.pipe(take(1)).pipe(
			map((value) =>
				value.reduce((pre: any, curr) => {
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
				}, {}),
			),
			map(({ min, max }) => {
				let finalValue = { min, max };
				if (
					DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(min)) > DateTimeUtils.TimeToNumber(min) ||
					DateTimeUtils.TimeToNumber('02:00:00') >= DateTimeUtils.TimeToNumber(min)
				) {
					finalValue = { ...finalValue, min: '00:00:00' };
				} else {
					finalValue = { ...finalValue, min: this.calculate(120, min, 'minus') };
				}
				if (
					DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(max)) < DateTimeUtils.TimeToNumber(max) ||
					DateTimeUtils.TimeToNumber('22:00:00') <= DateTimeUtils.TimeToNumber(max)
				) {
					finalValue = { ...finalValue, max: DateTimeUtils.LocalToUTCTimeTimeString('23:59:00') };
				} else {
					finalValue = { ...finalValue, max: this.calculate(120, max, 'plus') };
				}
				return { ...finalValue, grayOutMin: min, grayOutMax: max };
			}),
		);

		this.signalRService.priorityModuleData$.pipe(takeUntil(this.destroy$$)).subscribe((data) => {
			const indexOfChangedSlot = this.currentSlotPercentageData.findIndex((ele) => ele.date == data.date);
			if (indexOfChangedSlot !== -1) {
				this.currentSlotPercentageData[indexOfChangedSlot] = data;
				this.slotPercentage$$.next(this.currentSlotPercentageData);
			}
		});

		this.dates$$
			.asObservable()
			.pipe(
				debounceTime(500),
				filter((dates) => !!dates.length),
				switchMap((dates) => this.priorityApiSvc.getPriorityPercentage$(dates)),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (slotPercentage) => {
					this.slotPercentage$$.next(slotPercentage);
					this.currentSlotPercentageData = slotPercentage;
				},
			});
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

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public updateDate(newDate: Date, isWeekChange: boolean = false) {
		this.selectedDate$$.next(new Date(newDate));
		this.updateQuery('', newDate, isWeekChange ? '' : 'appointment');
	}

	public updateToToday() {
		this.newDate$$.next({ date: new Date(), isWeekChange: false });
		this.updateQuery('', new Date(), '');
	}

	public changeDate(offset: number) {
		this.changeWeek$$.next(offset);
	}

	public changeToDayView(date: Date) {
		this.newDate$$.next({ date, isWeekChange: false });
		this.selectedDate$$.next(date);
	}

	public currentWeekDays(days: any) {
		const dates = days.map((item) => {
			const newDate = new Date();
			newDate.setDate(item[0]);
			newDate.setMonth(item[1]);
			newDate.setFullYear(item[2])
			return this.datePipe.transform(newDate, 'yyyy-MM-dd');
		});

		this.dates$$.next(dates);
		this.getOpenCloseSlotData(dates);
	}

	private getOpenCloseSlotData(dates) {
		this.priorityApiSvc.getOpenCloseSlotData(dates).subscribe((res) => {
			const response = res.reduce((accumulator, currentValue) => {
				return { ...accumulator, [Object.keys(currentValue)[0]]: currentValue[Object.keys(currentValue)[0]] };
			}, {});
			this.prioritySlotsCloseOpen$$.next(response);
			this.currentDays = dates;
			this.prioritySlotOpenAndCloseMap();
			//
		});
	}

	private prioritySlotOpenAndCloseMap() {
		if (!Object.keys(this.prioritySlots$$.value).length || !Object.keys(this.prioritySlotsCloseOpen$$.value).length) return;
		let prioritySlot = { ...this.prioritySlots$$.value };
		const prioritySlotsCloseOpen = { ...this.prioritySlotsCloseOpen$$.value };
		Object.keys(prioritySlotsCloseOpen).forEach((date) => {
			if (prioritySlot[date]) {
				if (prioritySlotsCloseOpen[date]?.length) {
					prioritySlot = {
						...prioritySlot,
						[date]: prioritySlot[date]?.map((data) => ({
							...data,
							isClose: prioritySlotsCloseOpen[date]?.find(({ prioritySlotId }) => prioritySlotId === data.id)?.isClose,
						})),
					};
				} else {
					prioritySlot = { ...prioritySlot, [date]: prioritySlot[date].map(({ isClose, ...rest }) => ({ ...rest })) };
				}
			}
		});
		this.prioritySlots$$.next(prioritySlot);
	}

	private updateQuery(queryStr?: string, date?: Date, routeName: string = '') {
		this.router.navigate(routeName?.length ? [routeName] : [], {
			queryParams: {
				...(queryStr ? { v: queryStr } : { v: 'd' }),
				...(date ? { d: this.datePipe.transform(date, 'yyyy-MM-dd') } : {}),
			},
			queryParamsHandling: 'merge',
			replaceUrl: true,
		});
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
		// this.prioritySlotOpenAndCloseMap();
		if (Object.keys(this.prioritySlotsCloseOpen$$.value).length) this.getOpenCloseSlotData(this.currentDays);
	}

	public prioritySlotOpenAndClose(a) {
		const { prioritySlotid, percentage, date, isClose } = a;
		this.priorityApiSvc
			.openAndClosePrioritySlot(
				{
					prioritySlotid,
					percentage,
					date,
				},
				isClose,
			)
			.subscribe((res) => {
				let prioritySlot = { ...this.prioritySlots$$.value };
				const formatedDate = this.datePipe.transform(date, 'd-M-yyyy')!;
				prioritySlot = {
					...prioritySlot,
					[formatedDate]: prioritySlot[formatedDate]?.map((priority) => {
						if (priority.id === prioritySlotid) {
							return { ...priority, isClose };
						}
						return priority;
					}),
				};
				this.prioritySlots$$.next(prioritySlot);
			});
	}
}












