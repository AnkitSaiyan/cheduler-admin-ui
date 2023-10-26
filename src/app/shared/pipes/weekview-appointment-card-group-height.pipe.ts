import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { DateTimeUtils } from '../utils/date-time.utils';
import { getDurationMinutes } from '../models/calendar.model';

@Pipe({
	name: 'weekViewAppointmentCardGroupHeight',
})
export class WeekViewAppointmentCardGroupHeightPipe implements PipeTransform {
	constructor(private datePipe: DatePipe) {}

	public readonly timeInterval: number = 15;

	public readonly pixelsPerMin: number = 4;
	transform(groupedData: any[][], min: string, max: string): number {
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
		const startDate = this.myDate(groupStartDate).getTime() < this.myDate(min).getTime() ? this.myDate(min) : this.myDate(groupStartDate);

		if (this.myDate(groupEndDate).getTime() <= this.myDate(min).getTime()) {
			return 0;
		}

		if (this.myDate(groupStartDate).getTime() >= this.myDate(max).getTime()) {
			return 0;
		}
		const finalEndDate = this.myDate(groupEndDate).getTime() > this.myDate(max).getTime() ? this.myDate(max) : this.myDate(groupEndDate);

		const durationMinutes = getDurationMinutes(startDate, finalEndDate);
		return durationMinutes * this.pixelsPerMin;
	}

	private myDate(date: string): Date {
		if (!date) return new Date();
		const formattedDate = new Date();
		const splitDate = date.split(':');
		formattedDate.setHours(+splitDate[0]);
		formattedDate.setMinutes(+splitDate[1]);
		formattedDate.setSeconds(0);
		formattedDate.setMilliseconds(0);
		return formattedDate;
	}
}

