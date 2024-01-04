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

		const startDate =
			DateTimeUtils.timeStingToDate(groupStartDate).getTime() < DateTimeUtils.timeStingToDate(min).getTime()
				? DateTimeUtils.timeStingToDate(min)
				: DateTimeUtils.timeStingToDate(groupStartDate);

		if (DateTimeUtils.timeStingToDate(groupEndDate).getTime() <= DateTimeUtils.timeStingToDate(min).getTime()) {
			return 0;
		}

		if (DateTimeUtils.timeStingToDate(groupStartDate).getTime() >= DateTimeUtils.timeStingToDate(max).getTime()) {
			return 0;
		}

		const finalEndDate =
			DateTimeUtils.timeStingToDate(groupEndDate).getTime() > DateTimeUtils.timeStingToDate(max).getTime()
				? DateTimeUtils.timeStingToDate(max)
				: DateTimeUtils.timeStingToDate(groupEndDate);
		const durationMinutes = getDurationMinutes(startDate, finalEndDate);

		return durationMinutes * this.pixelsPerMin;
	}
}
