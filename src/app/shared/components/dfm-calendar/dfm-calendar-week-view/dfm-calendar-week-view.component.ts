import { DatePipe } from '@angular/common';
import {
	AfterViewChecked,
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	QueryList,
	ViewChildren,
	ViewEncapsulation,
} from '@angular/core';
import { BehaviorSubject, Subject, debounceTime, filter, takeUntil } from 'rxjs';
import { ModalService } from '../../../../core/services/modal.service';
import { getAllDaysOfWeek, getDurationMinutes } from '../../../models/calendar.model';
import { DateTimeUtils } from '../../../utils/date-time.utils';
import { DestroyableComponent } from '../../destroyable.component';

import { Appointment } from 'src/app/core/models/appointment.model';
import { DraggableService } from 'src/app/core/services/draggable.service';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';
// @Pipe({
//   name: 'calendarEventHeight',
//   standalone: true
// })
// class CalendarEventHeightPipe implements PipeTransform {
//   public transform(value: any[], pixelsPerMin: number): any {
//     let endDate: Date = value[0].endedAt;
//
//     value.forEach((data) => {
//       if (data.endedAt > endDate) {
//         endDate = data.endedAt;
//       }
//     });
//
//     const durationMinutes = getDurationMinutes(value[0].startedAt, endDate);
//
//     return durationMinutes * pixelsPerMin;
//   }
// }

@Component({
	selector: 'dfm-calendar-week-view',
	templateUrl: './dfm-calendar-week-view.component.html',
	styleUrls: ['./dfm-calendar-week-view.component.scss'],
	encapsulation: ViewEncapsulation.None,
})
export class DfmCalendarWeekViewComponent extends DestroyableComponent implements OnInit, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {
	@ViewChildren('eventContainer')
	private eventContainer!: QueryList<ElementRef>;

	@Input()
	public selectedDate!: Date;

	@Input()
	public changeWeek$$ = new BehaviorSubject<number>(0);

	@Input()
	public newDate$$ = new BehaviorSubject<{ date: Date | null; isWeekChange: boolean }>({ date: null, isWeekChange: false });

	@Input()
	public dataGroupedByDateAndTime!: { [key: string]: any[][] };

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

	// In minutes
	public readonly timeInterval: number = 15;

	public readonly pixelsPerMin: number = 4;

	public rendered = false;

	public DateTimeUtils = DateTimeUtils;

	public slotPriorityKey = {
		High: 'highPriorityPercentage',
		Medium: 'mediumPriorityPercentage',
		Low: 'lowPriorityPercentage',
	};

	public grayOutSlot$$: BehaviorSubject<any> = new BehaviorSubject<any>({});

	public getDurationFn = (s, e) => getDurationMinutes(s, e);

	private changeDateDebounce$$ = new Subject<number>();

	constructor(private datePipe: DatePipe, private cdr: ChangeDetectorRef, private modalSvc: ModalService, private draggableSvc: DraggableService) {
		super();
	}

	public ngOnChanges() {
		if (!this.selectedDate) {
			this.selectedDate = new Date();
		}
		if (this.showGrayOutSlot) {
			this.getGrayOutArea();
		}
		// console.log(this.prioritySlots, 'test');
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
	}

	public ngAfterViewInit() {
		// this.renderEvents();
		this.rendered = true;
	}

	public ngAfterViewChecked() {
		if (!this.rendered) {
			// this.rendered = true;
			// this.renderEvents();
			// this.cdr.markForCheck();
		}
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

	private emitDate(isWeekChange: boolean = false) {
		this.selectedDateEvent.emit({ selectedDate: this.selectedDate, isWeekChange });
	}

	public getMinute(date: string) {
		const splittedDate = date.split(':');
		return +splittedDate[0] * 60 + +splittedDate[1];
	}

	public changeToDayView(day: number, month: number, year: number) {
		const date = new Date(year, month, day);
		this.dayViewEvent.emit(date);
	}

	private renderEvents(): void {
		//   // debugger;
		//   if (this.dataGroupedByDateAndTime) {
		//
		//     this.eventContainer.forEach((elementRef) => {
		//       const div = elementRef.nativeElement as HTMLDivElement;
		//       const dataArray = this.dataGroupedByDateAndTime[div.id] as { group: number; data: any }[];
		//
		//       if (dataArray?.length) {
		//
		//         const pixelsPerMin = 4;
		//         const barHeight = 1;
		//         const title = 'Appointments';
		//         let groupNo = 1;
		//         let count = 0;
		//         let startedAt: Date;
		//         let endDate: Date | null;
		//
		//         dataArray.forEach(({ group, data }, index) => {
		//           if (group === groupNo) {
		//             count++;
		//             if (!endDate || new Date(data.endedAt) > endDate) {
		//               endDate = new Date(data.endedAt);
		//             }
		//           }
		//
		//           if (
		//             dataArray.length === 1 ||
		//             index === dataArray.length - 1 ||
		//             (index + 1 < dataArray.length - 1 && dataArray[index + 1].group !== groupNo)
		//           ) {
		//             // Calculating height for event card
		//             const totalMinutes = getDurationMinutes(startedAt ?? data.startedAt, data.endedAt);
		//             const height = totalMinutes * pixelsPerMin;
		//
		//             //  Calculating top for event card
		//             const startHour = new Date(startedAt ?? data.startedAt).getHours();
		//             const startMinute = new Date(startedAt ?? data.startedAt).getMinutes();
		//             // Number of horizontal bars in between
		//             const horizontalBarHeight = (height / (pixelsPerMin * this.timeInterval)) * barHeight;
		//             const top = (startMinute + startHour * 60) * pixelsPerMin - horizontalBarHeight;
		//
		//             // Event elements
		//             const eventTitle = document.createElement('span');
		//             const titleTextNode = document.createTextNode(title);
		//             eventTitle.classList.add('calender-week-view-event-title');
		//             eventTitle.appendChild(titleTextNode);
		//
		//             const eventTime = document.createElement('span');
		//             const timeText = `${this.datePipe.transform(startedAt ?? data.startedAt, 'HH:mm')} - ${this.datePipe.transform(endDate, 'HH:mm')}`;
		//             const timeTextNode = document.createTextNode(timeText);
		//             eventTime.classList.add('calender-week-view-event-time');
		//             eventTime.appendChild(timeTextNode);
		//
		//             const eventDetailsContainer = document.createElement('div');
		//             eventDetailsContainer.classList.add('calender-week-view-event-details-container');
		//             eventDetailsContainer.append(eventTitle, eventTime);
		//
		//             const circleIcon = document.createElement('div');
		//             const countTextNode = document.createTextNode(count.toString());
		//             circleIcon.classList.add('calender-week-view-event-circle-icon');
		//             circleIcon.appendChild(countTextNode);
		//
		//             const eventContainer = document.createElement('div');
		//             eventContainer.classList.add('calender-week-view-event-container');
		//             eventContainer.style.top = `${top}px`;
		//             eventContainer.style.height = `${height}px`;
		//             eventContainer.append(circleIcon, eventDetailsContainer);
		//
		//             div.appendChild(eventContainer);
		//
		//             count = 0;
		//
		//             if (index + 1 < dataArray.length - 1 && dataArray[index + 1].group !== groupNo) {
		//               groupNo = dataArray[index + 1].group;
		//               startedAt = new Date(dataArray[index + 1].data.startedAt);
		//             } else {
		//               groupNo = 1;
		//             }
		//
		//             endDate = null;
		//           }
		//         });
		//       }
		//     });
		//   }
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
			this.myDate(groupStartDate).getTime() < this.myDate(this.limit.min).getTime()
				? this.myDate(this.limit.min)
				: new Date(groupedData[0].startedAt);

		const groupEndDate = this.datePipe.transform(new Date(endDate), 'HH:mm:ss') ?? '';
		if (this.myDate(groupEndDate).getTime() <= this.myDate(this.limit.min).getTime()) {
			return 0;
		}

		if (this.myDate(groupStartDate).getTime() >= this.myDate(this.limit.max).getTime()) {
			return 0;
		}
		const finalEndDate =
			this.myDate(groupEndDate).getTime() > this.myDate(this.limit.max).getTime() ? this.myDate(this.limit.max) : new Date(endDate);

		const durationMinutes = getDurationMinutes(startDate, finalEndDate);
		return durationMinutes * this.pixelsPerMin;
	}

	public getPrioritySlotHeight(prioritySlot: any): number {
		const max = DateTimeUtils.UTCTimeToLocalTimeString(this.limit.max);
		let startDate: Date = this.myDate(prioritySlot.start);
		const min = DateTimeUtils.UTCDateToLocalDate(this.myDate(this.limit.min));
		startDate = startDate?.getTime() < min.getTime() ? min : startDate;
		if (this.myDate(prioritySlot.end).getTime() <= this.myDate(this.limit.min).getTime()) {
			return 0;
		}

		if (this.myDate(prioritySlot.start).getTime() >= this.myDate(max).getTime()) {
			return 0;
		}
		const endDate: Date = this.myDate(DateTimeUtils.TimeToNumber(prioritySlot.end) > DateTimeUtils.TimeToNumber(max) ? max : prioritySlot.end);
		const durationMinutes = getDurationMinutes(startDate, endDate);
		return durationMinutes * this.pixelsPerMin;
	}

	public getTop(groupedData: any[]): number {
		const groupStartDate = this.datePipe.transform(new Date(groupedData[0].startedAt), 'HH:mm:ss') ?? '';
		const startDate =
			this.myDate(groupStartDate).getTime() < this.myDate(this.limit.min).getTime()
				? this.myDate(this.limit.min)
				: new Date(groupedData[0].startedAt);
		const startHour = startDate.getHours();
		const startMinute = startDate.getMinutes();
		const startCalendarDate = this.myDate(this.limit.min);
		const startCalendarHour = startCalendarDate.getHours();
		const startCalendarMinute = startCalendarDate.getMinutes();
		const barHeight = 1;
		const horizontalBarHeight = (this.getHeight(groupedData) / (this.pixelsPerMin * this.timeInterval)) * barHeight;
		const top =
			(startMinute + startHour * 60) * this.pixelsPerMin - horizontalBarHeight - (startCalendarMinute + startCalendarHour * 60) * this.pixelsPerMin;
		if (top % 20) {
			return Math.floor(top / 20) * 20 + 20;
		}
		return top;
	}

	public getPrioritySlotTop(prioritySlot: any): number {
		const min = DateTimeUtils.UTCTimeToLocalTimeString(this.limit.min);
		const startDate = this.myDate(
			DateTimeUtils.TimeToNumber(prioritySlot.start) < DateTimeUtils.TimeToNumber(min) ? this.limit.min : prioritySlot.start,
		);
		const startHour = startDate.getHours();
		const startMinute = startDate.getMinutes();
		const startCalendarDate = this.myDate(min);
		const startCalendarHour = startCalendarDate.getHours();
		const startCalendarMinute = startCalendarDate.getMinutes();
		const barHeight = 1;
		const horizontalBarHeight = (this.getPrioritySlotHeight(prioritySlot) / (this.pixelsPerMin * this.timeInterval)) * barHeight;
		const top =
			(startMinute + startHour * 60) * this.pixelsPerMin - horizontalBarHeight - (startCalendarMinute + startCalendarHour * 60) * this.pixelsPerMin;
		// if (top < 0) return 0;
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
		this.addAppointment.emit({
			e: { offsetY: event.event.offsetY },
			day: event.day,
			grayOutSlot: this.grayOutSlot$$.value,
			isOutside: false,
			appointment: event.data,
		});
	}

	public dropOnGrayOutArea(event: any, day: any, grayOutArea: any) {
		event.stopPropagation();
		if (!this.draggableSvc.dragStartElement) return;
		this.draggableSvc.dragEndElementRef = { nativeElement: grayOutArea?.parentElement };
		this.draggableSvc.dragComplete(event);
		this.draggableSvc.removeDragShadow({ nativeElement: grayOutArea?.parentElement });
		this.addAppointment.emit({
			e: { ...event, offsetY: event.offsetY - this.draggableSvc.dragStartElement.event.offsetY },
			day,
			grayOutSlot: this.grayOutSlot$$.value,
			isOutside: true,
			appointment: this.draggableSvc.dragStartElement.data,
		});
	}

	private myDate(date: string): Date {
		if (!date) return new Date();
		const formattedDate = new Date();
		const splitDate = date.split(':');
		formattedDate.setHours(+splitDate[0]);
		formattedDate.setMinutes(+splitDate[1]);
		formattedDate.setSeconds(0);
		return formattedDate;
	}

	private getGrayOutArea() {
		if (this.practiceData === undefined || this.practiceData === null) return;
		const grayOutSlot: any = {};
		Object.keys(this.practiceData).forEach((value) => {
			const { intervals } = this.practiceData[value];

			if (value === '0') {
				grayOutSlot['6'] = [
					{
						dayStart: this.limit.min,
						dayEnd: intervals[0].dayStart,
						top: 0,
						height: getDurationMinutes(this.myDate(this.limit.min), this.myDate(intervals[0].dayStart)) * this.pixelsPerMin,
					},
				];

				const start1 = this.myDate(this.limit.min);
				const end1 = this.myDate(intervals[intervals.length - 1].dayEnd);
				const minutes1 = getDurationMinutes(start1, end1);

				grayOutSlot['6'] = [
					...grayOutSlot['6'],
					{
						dayStart: intervals[intervals.length - 1].dayEnd,
						dayEnd: this.limit.max,
						top: minutes1 * this.pixelsPerMin,
						height: getDurationMinutes(this.myDate(intervals[intervals.length - 1].dayEnd), this.myDate(this.limit.max)) * this.pixelsPerMin,
					},
				];

				if (intervals?.length > 1) {
					for (let i = 0; i < intervals.length - 1; i++) {
						const start = this.myDate(this.limit.min);
						const end = this.myDate(intervals[i].dayEnd);
						const minutes = getDurationMinutes(start, end);
						const timeInterval = getDurationMinutes(end, this.myDate(intervals[i + 1].dayStart));
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
			} else {
				grayOutSlot[+value - 1] = [
					{
						dayStart: this.limit.min,
						dayEnd: intervals[0].dayStart,
						top: 0,
						height: getDurationMinutes(this.myDate(this.limit.min), this.myDate(intervals[0].dayStart)) * this.pixelsPerMin,
					},
				];

				const start1 = this.myDate(this.limit.min);
				const end1 = this.myDate(intervals[intervals.length - 1].dayEnd);
				const minutes1 = getDurationMinutes(start1, end1);

				grayOutSlot[+value - 1] = [
					...grayOutSlot[+value - 1],
					{
						dayStart: intervals[intervals.length - 1].dayEnd,
						dayEnd: this.limit.max,
						top: minutes1 * this.pixelsPerMin,
						height: getDurationMinutes(this.myDate(intervals[intervals.length - 1].dayEnd), this.myDate(this.limit.max)) * this.pixelsPerMin,
					},
				];

				if (intervals?.length > 1) {
					for (let i = 0; i < intervals.length - 1; i++) {
						const start = this.myDate(this.limit.min);
						const end = this.myDate(intervals[i].dayEnd);
						const minutes = getDurationMinutes(start, end);
						const timeInterval = getDurationMinutes(end, this.myDate(intervals[i + 1].dayStart));
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
		});

		if (!this.practiceData[0]) {
			grayOutSlot['6'] = [
				{
					dayStart: this.limit.min,
					dayEnd: this.limit.max,
					top: 0,
					height: getDurationMinutes(this.myDate(this.limit.min), this.myDate(this.limit.max)) * this.pixelsPerMin,
				},
			];
		}
		this.grayOutSlot$$.next(grayOutSlot);
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
		// console.log(slotPercentage, prioritySlot, this.slotPriorityKey[prioritySlot.priority]);
		const obj = {
			prioritySlotid: prioritySlot.id,
			percentage: slotPercentage[this.slotPriorityKey[prioritySlot.priority]],
			date: slotPercentage.date,
			isClose,
		};
		this.openAndClosePrioritySlot.emit(obj);
	}

	public removeDuplicateData(data: any): Array<any> {
		const arr: any = [];
		data.forEach((user) => {
			if (user?.users.length) arr.push(...user.users);
		});

		if (arr.length) return GeneralUtils.removeDuplicateData(arr, 'id');
		return [];
	}

	public test(item: any) {
		console.log(item);
	}
}
