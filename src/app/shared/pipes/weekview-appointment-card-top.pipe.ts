import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { DateTimeUtils } from '../utils/date-time.utils';
import { getDurationMinutes } from '../models/calendar.model';

// Functions can be made common and optimized

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

		const startDate =
			DateTimeUtils.timeStingToDate(groupStartDate).getTime() < DateTimeUtils.timeStingToDate(min).getTime()
				? DateTimeUtils.timeStingToDate(min)
				: DateTimeUtils.timeStingToDate(groupStartDate);
		const startHour = startDate.getHours();
		const startMinute = startDate.getMinutes();
		const startCalendarDate = DateTimeUtils.timeStingToDate(min);
		const startCalendarHour = startCalendarDate.getHours();
		const startCalendarMinute = startCalendarDate.getMinutes();
		const barHeight = 1;
		let height = 0;
		const finalEndDate =
			DateTimeUtils.timeStingToDate(groupEndDate).getTime() > DateTimeUtils.timeStingToDate(max).getTime()
				? DateTimeUtils.timeStingToDate(max)
				: DateTimeUtils.timeStingToDate(groupEndDate);
		const durationMinutes = getDurationMinutes(startDate, finalEndDate);

		height = durationMinutes * this.pixelsPerMin;
		if (DateTimeUtils.timeStingToDate(groupEndDate).getTime() <= DateTimeUtils.timeStingToDate(min).getTime()) {
			height = 0;
		}

		if (DateTimeUtils.timeStingToDate(groupStartDate).getTime() >= DateTimeUtils.timeStingToDate(max).getTime()) {
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
}
