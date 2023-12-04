import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { PIXELS_PER_MIN } from '../utils/const';
import { DateTimeUtils } from '../utils/date-time.utils';

@Pipe({
	name: 'weekViewAbsenceTop',
})
export class WeekViewAbsenceTopPipe implements PipeTransform {
	constructor(private datePipe: DatePipe) {}

	transform(absences: any[], limit: any): any {
		const groupStartDate = this.datePipe.transform(new Date(absences[0]?.startedAt), 'HH:mm:ss') ?? '';
		const startDate =
			DateTimeUtils.timeStingToDate(groupStartDate).getTime() < DateTimeUtils.timeStingToDate(limit.min).getTime()
				? DateTimeUtils.timeStingToDate(limit.min)
				: new Date(absences[0].startedAt);
		const startHour = startDate.getHours();
		const startMinute = startDate.getMinutes();
		const startCalendarDate = DateTimeUtils.timeStingToDate(limit.min);
		const startCalendarHour = startCalendarDate.getHours();
		const startCalendarMinute = startCalendarDate.getMinutes();
		// const barHeight = 1;
		const top = (startMinute + startHour * 60) * PIXELS_PER_MIN - (startCalendarMinute + startCalendarHour * 60) * PIXELS_PER_MIN;
		if (
			DateTimeUtils.TimeToNumber(absences?.[0].end) < DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(limit.min)) ||
			DateTimeUtils.TimeToNumber(absences?.[0].start) > DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(limit.max)) + 1
		) {
			return -1;
		}
		if (
			DateTimeUtils.TimeToNumber(absences?.[0]?.start) < DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(limit.min)) &&
			DateTimeUtils.TimeToNumber(absences?.[0]?.end) > DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(limit.min))
		) {
			return 0;
		}
		if (top % 20) {
			return Math.floor(top / 20) * 20 + 20;
		}
		return top;
	}
}
