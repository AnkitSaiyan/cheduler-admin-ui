import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { DateTimeUtils } from '../utils/date-time.utils';
import { getDurationMinutes } from '../models/calendar.model';

// TODO: Functions can be made common and optimized

@Pipe({
	name: 'weekViewAppointmentCardTop',
})
export class WeekViewAppointmentCardTopPipe implements PipeTransform {
	constructor(private datePipe: DatePipe) {}

	public readonly timeInterval: number = 15;

	public readonly pixelsPerMin: number = 4;

	transform(groupedData: any[][], min: string, max: string): number {
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

		const startDate = this.myDate(groupStartDate).getTime() < this.myDate(min).getTime() ? this.myDate(min) : this.myDate(groupStartDate);
		const startHour = startDate.getHours();
		const startMinute = startDate.getMinutes();
		const startCalendarDate = this.myDate(min);
		const startCalendarHour = startCalendarDate.getHours();
		const startCalendarMinute = startCalendarDate.getMinutes();
		const barHeight = 1;
		let height = 0;
		const finalEndDate = this.myDate(groupEndDate).getTime() > this.myDate(max).getTime() ? this.myDate(max) : this.myDate(groupEndDate);
		const durationMinutes = getDurationMinutes(startDate, finalEndDate);

		height = durationMinutes * this.pixelsPerMin;
		if (this.myDate(groupEndDate).getTime() <= this.myDate(min).getTime()) {
			height = 0;
		}

		if (this.myDate(groupStartDate).getTime() >= this.myDate(max).getTime()) {
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

	private myDate(date: string): Date {
		if (!date) {
			return new Date();
		}

		const formattedDate = new Date();
		const splitDate = date.split(':');

		formattedDate.setHours(+splitDate[0]);
		formattedDate.setMinutes(+splitDate[1]);
		formattedDate.setSeconds(0);
		formattedDate.setMilliseconds(0);

		return formattedDate;
	}
}










