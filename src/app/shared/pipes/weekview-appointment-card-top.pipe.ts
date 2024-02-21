import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { DateTimeUtils } from '../utils/date-time.utils';
import { PIXELS_PER_MIN, TIME_INTERVAL } from '../utils/const';

// Functions can be made common and optimized

@Pipe({
	name: 'weekViewAppointmentCardTop',
})
export class WeekViewAppointmentCardTopPipe implements PipeTransform {
	constructor(private datePipe: DatePipe) {}

	public readonly timeInterval: number = TIME_INTERVAL;

	public readonly pixelsPerMin: number = PIXELS_PER_MIN;

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

		const top =
			(startMinute + startHour * 60) * this.pixelsPerMin - (startCalendarMinute + startCalendarHour * 60) * this.pixelsPerMin;

		if (top % 20) {
			return Math.floor(top / 20) * 20 + 20;
		}

		return top;
	}
}
