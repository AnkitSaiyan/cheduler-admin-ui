import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import {getDaysOfMonth, getDurationMinutes, getWeekdayWiseDays, Weekday} from '../../../models/calendar.model';

@Component({
	selector: 'dfm-calendar-month-view',
	templateUrl: './dfm-calendar-month-view.component.html',
	styleUrls: ['./dfm-calendar-month-view.component.scss'],
})
export class DfmCalendarMonthViewComponent implements OnInit, OnChanges {
	public weekDayEnum = Weekday;

	public nowDate = new Date();

	public daysInMonthMatrix: number[][] = [];

	public getDurationFn = (s, e) => getDurationMinutes(s, e);

	@Input()
	public selectedDate!: Date;

	@Input()
	public changeMonth$$ = new BehaviorSubject<number>(0);

	@Input()
	public newDate$$ = new BehaviorSubject<Date | null>(null);

	@Input()
	public dataGroupedByDate!: { [key: string]: any[] };

	@Output()
	public selectedDateEvent = new EventEmitter<Date>();

	@Output()
	public dayViewEvent = new EventEmitter<Date>();

	constructor() {}

	public ngOnChanges(changes: SimpleChanges) {
		if (!this.selectedDate) {
			this.selectedDate = new Date();
		}

		const currentValue = changes['dataGroupedByDate']?.currentValue;
		const previousValue = changes['dataGroupedByDate']?.previousValue;

		if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
			this.dataGroupedByDate = currentValue;
		}
	}

	public ngOnInit(): void {
		this.updateCalendarDays();

		this.changeMonth$$
			.asObservable()
			.pipe(filter((offset) => !!offset))
			.subscribe({
				next: (offset) => this.changeMonth(offset),
			});

		this.newDate$$
			.asObservable()
			.pipe()
			.subscribe({
				next: (date) => {
					if (date) {
						this.updateDate(date);
						this.updateCalendarDays();
					}
				},
			});
	}

	public changeMonth(offset: number) {
		const year = this.selectedDate.getFullYear();
		const month = this.selectedDate.getMonth();

		// checking if prev or next month has today's date
		if (getDaysOfMonth(year, month + offset) < this.selectedDate.getDate()) {
			this.selectedDate.setDate(1);
		}

		this.selectedDate.setMonth(this.selectedDate.getMonth() + offset);

		// if selected month is today's month then selected today's date by default
		if (this.selectedDate.getMonth() === new Date().getMonth()) {
			this.selectedDate.setDate(new Date().getDate());
		}

		this.updateCalendarDays();
		this.emitDate();

		this.changeMonth$$.next(0);
	}

	private updateDate(date: Date) {
		this.selectedDate = new Date(date);
		this.emitDate();
	}

	private updateCalendarDays() {
		this.daysInMonthMatrix = getWeekdayWiseDays(this.selectedDate);
	}

	private emitDate() {
		this.selectedDateEvent.emit(this.selectedDate);
	}

	public changeToDayView(day: number, month: number, year: number) {
		const date = new Date(year, month, day);
		this.dayViewEvent.emit(date);
	}
}
