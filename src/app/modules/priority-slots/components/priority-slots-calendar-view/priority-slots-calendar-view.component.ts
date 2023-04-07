import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, map, Observable, of, take, takeUntil } from 'rxjs';
import { PracticeHoursApiService } from 'src/app/core/services/practice-hours-api.service';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { RepeatType } from 'src/app/shared/models/absence.model';
import { getDateOfMonth } from 'src/app/shared/models/calendar.model';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { CustomDateParserFormatter } from '../../../../shared/utils/dateFormat';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';

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

	public newDate$$ = new BehaviorSubject<Date | null>(null);

	public prioritySlots$$: BehaviorSubject<any>;

	public slotPercentage$$: BehaviorSubject<any[]>;

	public practiceHourMinMax$: Observable<{ min: string; max: string; grayOutMin: string; grayOutMax: string } | null> = of(null);

	constructor(
		private router: Router,
		private datePipe: DatePipe,
		private priorityApiSvc: PrioritySlotApiService,
		private practiceHourSvc: PracticeHoursApiService,
	) {
		super();
		this.prioritySlots$$ = new BehaviorSubject<any>({});
		this.slotPercentage$$ = new BehaviorSubject<any[]>([]);
	}

	public appointmentsGroupedByDateAndTIme: { [key: string]: any[][] } = {};

	ngOnInit() {
		this.dataControl.valueChanges.pipe(takeUntil(this.destroy$$)).subscribe((value: any) => {
			const date = new Date(value.year, value.month - 1, value.day);
			this.updateDate(date);
			this.newDate$$.next(date);
		});

		this.priorityApiSvc.prioritySlots$.pipe(takeUntil(this.destroy$$)).subscribe((prioritySlots) => {
			this.setPrioritySlots(prioritySlots);
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
				if (DateTimeUtils.TimeToNumber('02:00:00') >= DateTimeUtils.TimeToNumber(min)) {
					finalValue = { ...finalValue, min: '00:00:00' };
				} else {
					finalValue = { ...finalValue, min: this.calculate(120, min, 'minus') };
				}
				if (DateTimeUtils.TimeToNumber('22:00:00') <= DateTimeUtils.TimeToNumber(max)) {
					finalValue = { ...finalValue, max: '23:59:00' };
				} else {
					finalValue = { ...finalValue, max: this.calculate(120, max, 'plus') };
				}
				return { ...finalValue, grayOutMin: min, grayOutMax: max };
			}),
		);

		this.practiceHourMinMax$.subscribe(console.log);
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

	public updateDate(newDate: Date) {
		this.selectedDate$$.next(new Date(newDate));
		this.updateQuery('', newDate);
	}

	public updateToToday() {
		if (this.selectedDate$$.value?.toDateString() !== new Date().toDateString()) {
			this.newDate$$.next(new Date());
		}
	}

	public changeDate(offset: number) {
		this.changeWeek$$.next(offset);
	}

	public changeToDayView(date: number) {
		const newDate = new Date(this.selectedDate$$.value.setDate(date));
		this.newDate$$.next(newDate);
		this.selectedDate$$.next(new Date(newDate));
	}

	public currentWeekDays(days: any) {
		const dates = days.map((item) => {
			const newDate = new Date();
			newDate.setMonth(item[1]);
			newDate.setDate(item[0]);
			return this.datePipe.transform(newDate, 'yyyy-MM-dd');
		});

		this.priorityApiSvc
			.getPriorityPercentage$(dates)
			.pipe(takeUntil(this.destroy$$))
			.subscribe((slotPercentage) => {
				this.slotPercentage$$.next(slotPercentage);
			});
		console.log({ dates });
	}

	private updateQuery(queryStr?: string, date?: Date) {
		this.router.navigate([], {
			queryParams: {
				...(queryStr ? { v: queryStr } : {}),
				...(date ? { d: this.datePipe.transform(date, 'yyyy-MM-dd') } : {}),
			},
			queryParamsHandling: 'merge',
		});
	}

	private setPrioritySlots(prioritySlots: PrioritySlot[]) {
		const myPrioritySlots = {};
		prioritySlots.forEach((prioritySlot: PrioritySlot) => {
			let { repeatFrequency } = prioritySlot;
			const { priority, nxtSlotOpenPct } = prioritySlot;
			const startDate = new Date(new Date(prioritySlot.startedAt).toDateString());
			let firstDate = new Date(new Date(prioritySlot.startedAt).toDateString());
			const lastDate = new Date(new Date(prioritySlot.endedAt).toDateString());
			switch (true) {
				case !prioritySlot.isRepeat:
				case prioritySlot.repeatType === RepeatType.Daily: {
					repeatFrequency = prioritySlot.isRepeat ? repeatFrequency : 1;
					while (true) {
						const dateString = this.datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
						const customPrioritySlot = {
							start: prioritySlot.slotStartTime.slice(0, 5),
							end: prioritySlot.slotEndTime?.slice(0, 5),
							priority,
							nxtSlotOpenPct,
						};
						myPrioritySlots[dateString] = myPrioritySlots[dateString] ? [...myPrioritySlots[dateString], customPrioritySlot] : [customPrioritySlot];
						if (firstDate.getTime() >= lastDate.getTime()) break;
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

		console.log({ myPrioritySlots });
		this.prioritySlots$$.next({ ...myPrioritySlots });
	}
}

