import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, Subject, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil } from 'rxjs';

import { DraggableService } from 'src/app/core/services/draggable.service';
import { Appointment } from 'src/app/shared/models/appointment.model';
import { AbsenceApiService } from 'src/app/core/services/absence-api.service';
import { ActivatedRoute, Params } from '@angular/router';
import { DestroyableComponent } from '../../destroyable.component';
import { DateTimeUtils } from '../../../utils/date-time.utils';
import {
	calendarDistinctUntilChanged,
	dataModification,
	getAllDaysOfWeek,
	getDurationMinutes,
	getFromAndToDate,
} from '../../../models/calendar.model';
import { PIXELS_PER_MIN, TIME_INTERVAL } from 'src/app/shared/utils/const';

@Component({
	selector: 'dfm-calendar-week-view',
	templateUrl: './dfm-calendar-week-view.component.html',
	styleUrls: ['./dfm-calendar-week-view.component.scss'],
	encapsulation: ViewEncapsulation.None,
})
export class DfmCalendarWeekViewComponent extends DestroyableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
	@Input()
	public size: 'sm' | 'lg' = 'sm';

	@Input()
	public selectedDate!: Date;

	@Input()
	public changeWeek$$ = new BehaviorSubject<number>(0);

	@Input()
	public newDate$$ = new BehaviorSubject<{ date: Date | null; isWeekChange: boolean }>({ date: null, isWeekChange: false });

	@Input()
	public appointmentData: { [key: string]: any[][] } = {};

	@Input()
	public absenceData: { [key: string]: any[] } = {};

	@Input()
	public prioritySlots!: { [key: string]: any[] };

	@Input()
	public practiceData!: any;

	@Input()
	public prioritySlotsVariant: 'small' | 'large' = 'large';

	@Input()
	public format24Hour = false;

	@Input()
	public limit = { min: '00:00:00', max: '24:00:00', grayOutMin: '00:00:00', grayOutMax: '24:00:00' };

	@Input()
	public slotPercentage: any[] = [];

	@Input()
	public showGrayOutSlot: boolean = false;

	@Output()
	public selectedDateEvent = new EventEmitter<{ selectedDate: Date; isWeekChange: boolean }>();

	@Output()
	public dayViewEvent = new EventEmitter<Date>();

	@Output()
	public openAndClosePrioritySlot = new EventEmitter<any>();

	@Output()
	public addAppointment = new EventEmitter<{
		e: MouseEvent | { offsetY: string };
		eventsContainer?: HTMLDivElement;
		day?: number[];
		grayOutSlot: any;
		isOutside: boolean;
		appointment?: Appointment;
	}>();

	@Output()
	public currentWeekDays = new EventEmitter<Array<[number, number, number]>>();

	@Output()
	private dateChange = new EventEmitter<number>();

	public daysOfWeekArr: Array<[number, number, number]> = [];

	public todayDate = new Date();

	public getDurationMinutes = getDurationMinutes;

	// In minutes
	public readonly timeInterval: number = TIME_INTERVAL;

	public readonly pixelsPerMin: number = PIXELS_PER_MIN;

	public rendered = false;

	public DateTimeUtils = DateTimeUtils;

	public slotPriorityKey = {
		High: 'highPriorityPercentage',
		Medium: 'mediumPriorityPercentage',
		Low: 'lowPriorityPercentage',
	};

	public grayOutSlot$$: BehaviorSubject<any> = new BehaviorSubject<any>({});

	public getDurationFn = (s, e) => getDurationMinutes(s, e);

	public hideAbsenceData = {};

	private changeDateDebounce$$ = new Subject<number>();

	public holidayData$$ = new BehaviorSubject<any>({});

	public isHoverOnAppointmentCard = false;

	private childWidth = 0;

	constructor(
		private datePipe: DatePipe,
		public draggableSvc: DraggableService,
		private route: ActivatedRoute,
		private absenceApiSvc: AbsenceApiService,
	) {
		super();
	}

	public ngOnChanges() {
		if (!this.selectedDate) {
			this.selectedDate = new Date();
		}
		if (this.showGrayOutSlot) {
			this.getGrayOutArea();
		}

		this.setHideAbsence(this.absenceData);
	}

	public ngOnInit(): void {
		this.updateCalendarDays();

		this.changeDateDebounce$$.pipe(debounceTime(500), takeUntil(this.destroy$$)).subscribe((value) => this.dateChange.emit(value));

		this.changeWeek$$
			.pipe(
				filter((offset) => !!offset),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (offset) => this.changeWeek(offset),
			});

		this.newDate$$
			.asObservable()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: ({ date, isWeekChange }) => {
					if (date) {
						this.updateDate(date, isWeekChange);
						this.updateCalendarDays();
					}
				},
			});

		this.route.queryParams
			.pipe(
				filter(Boolean),
				filter((queryParams: Params) => !!queryParams['v'] && !!queryParams['d']),
				distinctUntilChanged(calendarDistinctUntilChanged),
				map((data) => getFromAndToDate(data)),
				switchMap(({ fromDate, toDate }) => {
					return this.absenceApiSvc.absencesHolidayForCalendar$(fromDate, toDate);
				}),
				map((data) => dataModification(data.data, this.datePipe)),
				takeUntil(this.destroy$$),
			)
			.subscribe((data) => {
				this.holidayData$$.next(data);
			});
	}

	public ngAfterViewInit() {
		this.rendered = true;
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public changeWeek(offset: number) {
		if (offset !== 0) {
			const date = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + offset * 7));
			this.updateDate(date, true);
			this.changeWeek$$.next(0);
		}

		this.updateCalendarDays();
	}

	private updateCalendarDays() {
		this.daysOfWeekArr = getAllDaysOfWeek(this.selectedDate);
		this.currentWeekDays.emit(this.daysOfWeekArr);
		this.rendered = false;
	}

	private updateDate(date: Date, isWeekChange: boolean = false) {
		date.setMinutes(date.getMinutes() - (date.getMinutes() % 5));
		this.selectedDate = date;
		this.emitDate(isWeekChange);
	}

	private setHideAbsence(absence: { [key: string]: any[] }) {
		this.hideAbsenceData = {};
		if (!Object.keys(absence)?.length) {
			return;
		}
		Object.entries(absence).forEach(([key, data]) => {
			data.forEach((items) => {
				items.forEach((abse) => {
					if (
						DateTimeUtils.TimeToNumber(abse.end) < DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(this.limit.min)) ||
						DateTimeUtils.TimeToNumber(abse.start) > DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(this.limit.max)) + 1
					) {
						if (this.hideAbsenceData[key]) {
							this.hideAbsenceData[key] = [...this.hideAbsenceData[key], absence];
						} else {
							this.hideAbsenceData[key] = [absence];
						}
					}
				});
			});
		});
	}

	private emitDate(isWeekChange: boolean = false) {
		this.selectedDateEvent.emit({ selectedDate: this.selectedDate, isWeekChange });
	}

	public getMinute(date: string) {
		const splittedDate = date.split(':');
		return +splittedDate[0] * 60 + +splittedDate[1];
	}

	public getMargin(start: Date, end: Date) {
		const localStartTime = this.datePipe.transform(DateTimeUtils.UTCDateToLocalDate(new Date(start), true), 'HH:mm:ss') ?? '';

		const localEndTime = this.datePipe.transform(DateTimeUtils.UTCDateToLocalDate(new Date(end), true), 'HH:mm:ss') ?? '';

		const startDate =
			DateTimeUtils.timeStingToDate(localStartTime).getTime() <
			DateTimeUtils.UTCDateToLocalDate(DateTimeUtils.timeStingToDate(this.limit.min)).getTime()
				? DateTimeUtils.UTCDateToLocalDate(DateTimeUtils.timeStingToDate(this.limit.min))
				: DateTimeUtils.timeStingToDate(localStartTime);

		const endDate =
			DateTimeUtils.timeStingToDate(localEndTime).getTime() <
			DateTimeUtils.UTCDateToLocalDate(DateTimeUtils.timeStingToDate(this.limit.min)).getTime()
				? DateTimeUtils.UTCDateToLocalDate(DateTimeUtils.timeStingToDate(this.limit.min))
				: DateTimeUtils.timeStingToDate(localEndTime);

		const margin = getDurationMinutes(startDate, endDate);
		return margin;
	}

	public changeToDayView(day: number, month: number, year: number) {
		const date = new Date(year, month, day);
		this.dayViewEvent.emit(date);
	}

	public getHeight(groupedData: any[]): number {
		let endDate: Date = groupedData[0].endedAt;
		groupedData.forEach((data) => {
			if (data.endedAt > endDate) {
				endDate = data.endedAt;
			}
		});
		const groupStartDate = this.datePipe.transform(new Date(groupedData[0].startedAt), 'HH:mm:ss') ?? '';

		const startDate =
			DateTimeUtils.timeStingToDate(groupStartDate).getTime() < DateTimeUtils.timeStingToDate(this.limit.min).getTime()
				? DateTimeUtils.timeStingToDate(this.limit.min)
				: new Date(groupedData[0].startedAt);

		const groupEndDate = this.datePipe.transform(new Date(endDate), 'HH:mm:ss') ?? '';
		if (DateTimeUtils.timeStingToDate(groupEndDate).getTime() <= DateTimeUtils.timeStingToDate(this.limit.min).getTime()) {
			return 0;
		}

		if (DateTimeUtils.timeStingToDate(groupStartDate).getTime() >= DateTimeUtils.timeStingToDate(this.limit.max).getTime()) {
			return 0;
		}
		const finalEndDate =
			DateTimeUtils.timeStingToDate(groupEndDate).getTime() > DateTimeUtils.timeStingToDate(this.limit.max).getTime()
				? DateTimeUtils.timeStingToDate(this.limit.max)
				: new Date(endDate);

		const durationMinutes = getDurationMinutes(startDate, finalEndDate);
		return durationMinutes * this.pixelsPerMin;
	}

	public getGroupHeight(groupedData: any[][]): number {
		let groupStartDate = this.datePipe.transform(new Date(groupedData?.[0]?.[0].startedAt), 'HH:mm:ss') ?? '';
		let groupEndDate = this.datePipe.transform(new Date(groupedData?.[0]?.[0].endedAt), 'HH:mm:ss') ?? '';
		groupedData.forEach((data) => {
			const startDate = this.datePipe.transform(new Date(data?.[0]?.startedAt), 'HH:mm:ss')!;
			const sortedData = [...data].sort((s1, s2) => (s1.endedAt.getTime() > s2.endedAt.getTime() ? -1 : 1));
			const endDate = this.datePipe.transform(new Date(sortedData?.[0]?.endedAt), 'HH:mm:ss')!;
			if (DateTimeUtils.TimeToNumber(groupStartDate) > DateTimeUtils.TimeToNumber(startDate)) {
				groupStartDate = startDate;
			}
			if (DateTimeUtils.TimeToNumber(groupEndDate) < DateTimeUtils.TimeToNumber(endDate)) {
				groupEndDate = endDate;
			}
		});
		const startDate =
			DateTimeUtils.timeStingToDate(groupStartDate).getTime() < DateTimeUtils.timeStingToDate(this.limit.min).getTime()
				? DateTimeUtils.timeStingToDate(this.limit.min)
				: DateTimeUtils.timeStingToDate(groupStartDate);

		if (DateTimeUtils.timeStingToDate(groupEndDate).getTime() <= DateTimeUtils.timeStingToDate(this.limit.min).getTime()) {
			return 0;
		}

		if (DateTimeUtils.timeStingToDate(groupStartDate).getTime() >= DateTimeUtils.timeStingToDate(this.limit.max).getTime()) {
			return 0;
		}
		const finalEndDate =
			DateTimeUtils.timeStingToDate(groupEndDate).getTime() > DateTimeUtils.timeStingToDate(this.limit.max).getTime()
				? DateTimeUtils.timeStingToDate(this.limit.max)
				: DateTimeUtils.timeStingToDate(groupEndDate);

		const durationMinutes = getDurationMinutes(startDate, finalEndDate);
		return durationMinutes * this.pixelsPerMin;
	}

	public getAbsenceHeight(groupedData: any[]): number {
		let endDate: Date = groupedData[0].endedAt;
		let endTime: string = groupedData[0]?.end;
		groupedData.forEach((data) => {
			if (DateTimeUtils.TimeToNumber(data.end) > DateTimeUtils.TimeToNumber(endTime)) {
				endDate = data.endedAt;
				endTime = data.end;
			}
		});

		const groupStartDate = this.datePipe.transform(DateTimeUtils.UTCDateToLocalDate(new Date(groupedData[0].startedAt)), 'HH:mm:ss') ?? '';

		const startDate =
			DateTimeUtils.timeStingToDate(groupStartDate).getTime() <
			DateTimeUtils.timeStingToDate(DateTimeUtils.UTCTimeToLocalTimeString(this.limit.min)).getTime()
				? DateTimeUtils.timeStingToDate(this.limit.min)
				: new Date(groupedData[0].startedAt);

		return this.getMargin(startDate, endDate) * this.pixelsPerMin;
	}

	public getPrioritySlotHeight(prioritySlot: any): number {
		const max = DateTimeUtils.UTCTimeToLocalTimeString(this.limit.max);
		let startDate: Date = DateTimeUtils.timeStingToDate(prioritySlot.start);
		const min = DateTimeUtils.UTCDateToLocalDate(DateTimeUtils.timeStingToDate(this.limit.min));
		startDate = startDate?.getTime() < min.getTime() ? min : startDate;
		if (DateTimeUtils.timeStingToDate(prioritySlot.end).getTime() <= DateTimeUtils.timeStingToDate(this.limit.min).getTime()) {
			return 0;
		}

		if (DateTimeUtils.timeStingToDate(prioritySlot.start).getTime() >= DateTimeUtils.timeStingToDate(max).getTime()) {
			return 0;
		}
		const endDate: Date = DateTimeUtils.timeStingToDate(
			DateTimeUtils.TimeToNumber(prioritySlot.end) > DateTimeUtils.TimeToNumber(max) ? max : prioritySlot.end,
		);
		const durationMinutes = getDurationMinutes(startDate, endDate);
		return durationMinutes * this.pixelsPerMin;
	}

	public getTop(groupedData: any[][]): number {
		let groupStartDate = this.datePipe.transform(new Date(groupedData?.[0]?.[0].startedAt), 'HH:mm:ss') ?? '';
		let groupEndDate = this.datePipe.transform(new Date(groupedData?.[0]?.[0].endedAt), 'HH:mm:ss') ?? '';
		groupedData.forEach((data) => {
			const startDate = this.datePipe.transform(new Date(data?.[0]?.startedAt), 'HH:mm:ss')!;

			const endDate = this.datePipe.transform(new Date(data?.[0]?.endedAt), 'HH:mm:ss')!;
			if (DateTimeUtils.TimeToNumber(groupStartDate) > DateTimeUtils.TimeToNumber(startDate)) {
				groupStartDate = startDate;
			}
			if (DateTimeUtils.TimeToNumber(groupEndDate) < DateTimeUtils.TimeToNumber(endDate)) {
				groupEndDate = endDate;
			}
		});
		const startDate =
			DateTimeUtils.timeStingToDate(groupStartDate).getTime() < DateTimeUtils.timeStingToDate(this.limit.min).getTime()
				? DateTimeUtils.timeStingToDate(this.limit.min)
				: DateTimeUtils.timeStingToDate(groupStartDate);
		const startHour = startDate.getHours();
		const startMinute = startDate.getMinutes();
		const startCalendarDate = DateTimeUtils.timeStingToDate(this.limit.min);
		const startCalendarHour = startCalendarDate.getHours();
		const startCalendarMinute = startCalendarDate.getMinutes();
		const barHeight = 1;

		let height = 0;
		const finalEndDate =
			DateTimeUtils.timeStingToDate(groupEndDate).getTime() > DateTimeUtils.timeStingToDate(this.limit.max).getTime()
				? DateTimeUtils.timeStingToDate(this.limit.max)
				: DateTimeUtils.timeStingToDate(groupEndDate);
		const durationMinutes = getDurationMinutes(startDate, finalEndDate);

		height = durationMinutes * this.pixelsPerMin;
		if (DateTimeUtils.timeStingToDate(groupEndDate).getTime() <= DateTimeUtils.timeStingToDate(this.limit.min).getTime()) {
			height = 0;
		}

		if (DateTimeUtils.timeStingToDate(groupStartDate).getTime() >= DateTimeUtils.timeStingToDate(this.limit.max).getTime()) {
			height = 0;
		}

		const horizontalBarHeight = (height / (this.pixelsPerMin * this.timeInterval)) * barHeight;

		const top =
			(startMinute + startHour * 60) * this.pixelsPerMin - horizontalBarHeight - (startCalendarMinute + startCalendarHour * 60) * this.pixelsPerMin;
		if (top % 20) {
			return Math.floor(top / 20) * 20 + 20;
		}

		return top;
	}

	public getPrioritySlotTop(prioritySlot: any): number {
		const min = DateTimeUtils.UTCTimeToLocalTimeString(this.limit.min);
		const startDate = DateTimeUtils.timeStingToDate(
			DateTimeUtils.TimeToNumber(prioritySlot.start) < DateTimeUtils.TimeToNumber(min) ? this.limit.min : prioritySlot.start,
		);
		const startHour = startDate.getHours();
		const startMinute = startDate.getMinutes();
		const startCalendarDate = DateTimeUtils.timeStingToDate(min);
		const startCalendarHour = startCalendarDate.getHours();
		const startCalendarMinute = startCalendarDate.getMinutes();
		const top = (startMinute + startHour * 60) * this.pixelsPerMin - (startCalendarMinute + startCalendarHour * 60) * this.pixelsPerMin;

		if (top % 20) {
			return Math.floor(top / 20) * 20 + 20;
		}

		return top;
	}

	public onDblClick(e: MouseEvent, eventsContainer: HTMLDivElement, day: number[], isOutside: boolean = false, offsetY: number = 0) {
		this.addAppointment.emit({
			e: { ...e, offsetY: e.offsetY + offsetY },
			eventsContainer,
			day,
			grayOutSlot: this.grayOutSlot$$.value,
			isOutside,
		});
	}

	public editAppointment(event: any) {
		const weekday = new Date(event.day[2], event.day[1], event.day[0], 0, 0, 0, 0).getDay();
		const grayOutArea = this.grayOutSlot$$.value?.[(weekday + 7 - 1) % 7];
		let isOutside = grayOutArea?.some((item) => item.top < event.event.offsetY && item.top + item.height > event.event.offsetY);
		if (!grayOutArea) {
			isOutside = true;
		}
		this.addAppointment.emit({
			e: { offsetY: event.event.offsetY },
			day: event.day,
			grayOutSlot: this.grayOutSlot$$.value,
			isOutside,
			appointment: event.data,
		});
	}

	public dropOnGroupArea(event: any, day: any, grayOutArea: any, top: any, isOutside: boolean = true) {
		event.stopPropagation();
		if (!this.draggableSvc.dragStartElement) return;
		event.target.classList.remove('drag-area-border');
		this.draggableSvc.dragEndElementRef = { nativeElement: grayOutArea?.parentElement };
		this.draggableSvc.weekViewDragComplete(event);
		this.draggableSvc.removeDragShadow({ nativeElement: grayOutArea?.parentElement });
		this.addAppointment.emit({
			e: { ...event, offsetY: event.offsetY - this.draggableSvc.dragStartElement.event.offsetY + top },
			day,
			grayOutSlot: this.grayOutSlot$$.value,
			isOutside,
			appointment: this.draggableSvc.dragStartElement.data,
		});
	}

	private getGrayOutArea() {
		if (this.practiceData === undefined || this.practiceData === null) return;
		const grayOutSlot: any = {};
		Object.keys(this.practiceData).forEach((value) => {
			const { intervals } = this.practiceData[value];
			const noPracticeGraySlot = [
				{
					dayStart: this.limit.min,
					dayEnd: '',
					top: 0,
					height:
						getDurationMinutes(DateTimeUtils.timeStingToDate(this.limit.min), DateTimeUtils.timeStingToDate(this.limit.max)) * this.pixelsPerMin,
				},
				{
					dayStart: this.limit.min,
					dayEnd: intervals[0].dayStart,
					top: 0,
					height: 0,
				},
			];

			if (value === '0') {
				if (!intervals[0].dayStart) {
					grayOutSlot['6'] = noPracticeGraySlot;
				} else {
					grayOutSlot['6'] = [
						{
							dayStart: this.limit.min,
							dayEnd: '',
							top: 0,
							height:
								getDurationMinutes(DateTimeUtils.timeStingToDate(this.limit.min), DateTimeUtils.timeStingToDate(intervals[0].dayStart)) *
								this.pixelsPerMin,
						},
					];

					const start1 = DateTimeUtils.timeStingToDate(this.limit.min);
					const end1 = DateTimeUtils.timeStingToDate(intervals[intervals.length - 1].dayEnd);
					const minutes1 = getDurationMinutes(start1, end1);

					grayOutSlot['6'] = [
						...grayOutSlot['6'],
						{
							dayStart: intervals[intervals.length - 1].dayEnd,
							dayEnd: this.limit.max,
							top: minutes1 * this.pixelsPerMin,
							height:
								getDurationMinutes(
									DateTimeUtils.timeStingToDate(intervals[intervals.length - 1].dayEnd),
									DateTimeUtils.timeStingToDate(this.limit.max),
								) * this.pixelsPerMin,
						},
					];

					if (intervals?.length > 1) {
						for (let i = 0; i < intervals.length - 1; i++) {
							const start = DateTimeUtils.timeStingToDate(this.limit.min);
							const end = DateTimeUtils.timeStingToDate(intervals[i].dayEnd);
							const minutes = getDurationMinutes(start, end);
							const timeInterval = getDurationMinutes(end, DateTimeUtils.timeStingToDate(intervals[i + 1].dayStart));
							grayOutSlot['6'] = [
								...grayOutSlot['6'],
								{
									dayStart: intervals[i].dayEnd,
									dayEnd: intervals[i + 1].dayStart,
									top: minutes * this.pixelsPerMin,
									height: timeInterval * this.pixelsPerMin,
								},
							];
						}
					}
				}
			} else if (!intervals[0].dayStart) {
				grayOutSlot[+value - 1] = noPracticeGraySlot;
			} else {
				this.getGrayOutAreaElse(intervals, grayOutSlot, value);
			}
		});

		this.grayOutSlot$$.next(grayOutSlot);
	}

	private getGrayOutAreaElse(intervals: any, grayOutSlot: any, value: any) {
		grayOutSlot[+value - 1] = [
			{
				dayStart: this.limit.min,
				dayEnd: intervals[0].dayStart,
				top: 0,
				height:
					getDurationMinutes(DateTimeUtils.timeStingToDate(this.limit.min), DateTimeUtils.timeStingToDate(intervals[0].dayStart)) * this.pixelsPerMin,
			},
		];

		const start1 = DateTimeUtils.timeStingToDate(this.limit.min);
		const end1 = DateTimeUtils.timeStingToDate(intervals[intervals.length - 1].dayEnd);
		const minutes1 = getDurationMinutes(start1, end1);

		grayOutSlot[+value - 1] = [
			...grayOutSlot[+value - 1],
			{
				dayStart: intervals[intervals.length - 1].dayEnd,
				dayEnd: this.limit.max,
				top: minutes1 * this.pixelsPerMin,
				height:
					getDurationMinutes(DateTimeUtils.timeStingToDate(intervals[intervals.length - 1].dayEnd), DateTimeUtils.timeStingToDate(this.limit.max)) *
					this.pixelsPerMin,
			},
		];

		if (intervals?.length > 1) {
			for (let i = 0; i < intervals.length - 1; i++) {
				const start = DateTimeUtils.timeStingToDate(this.limit.min);
				const end = DateTimeUtils.timeStingToDate(intervals[i].dayEnd);
				const minutes = getDurationMinutes(start, end);
				const timeInterval = getDurationMinutes(end, DateTimeUtils.timeStingToDate(intervals[i + 1].dayStart));
				grayOutSlot[+value - 1] = [
					...grayOutSlot[+value - 1],
					{
						dayStart: intervals[i].dayEnd,
						dayEnd: intervals[i + 1].dayStart,
						top: minutes * this.pixelsPerMin,
						height: timeInterval * this.pixelsPerMin,
					},
				];
			}
		}
	}

	public changeDate(offset: number) {
		if (!this.draggableSvc.dragStartElement) return;
		this.changeDateDebounce$$.next(offset);
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

	public prioritySlotOpenAndClose(slotPercentage: any, prioritySlot: any, isClose: any) {
		const obj = {
			prioritySlotid: prioritySlot.id,
			percentage: slotPercentage?.percentage?.[prioritySlot.id] ?? 0,
			date: slotPercentage.date,
			isClose,
		};
		this.openAndClosePrioritySlot.emit(obj);
	}

	public hoverInAppointment(ele: HTMLDivElement, child: HTMLDivElement) {
		this.childWidth = child.offsetWidth;
		child.style.width = ele.offsetWidth + 'px';
		if (this.isHoverOnAppointmentCard) ele.classList.add('overflow-none');
	}

	public hoverOutAppointment(ele: HTMLDivElement, child: HTMLDivElement) {
		child.style.width = this.childWidth + 'px';
		setTimeout(() => {
			if (!this.isHoverOnAppointmentCard) ele.classList.remove('overflow-none');
		}, 200);
	}
}
