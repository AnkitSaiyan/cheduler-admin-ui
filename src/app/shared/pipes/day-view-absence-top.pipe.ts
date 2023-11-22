import { Pipe, PipeTransform } from '@angular/core';
import { DateTimeUtils } from '../utils/date-time.utils';
import { getDurationMinutes } from '../models/calendar.model';
import { PIXELS_PER_MIN } from '../utils/const';

@Pipe({
	name: 'dayViewAbsenceTop',
})
export class DayViewAbsenceTopPipe implements PipeTransform {
	transform(absence: any, selectedDate: Date, timeSlot: any): any {
		const start = DateTimeUtils.timeStingToDate(timeSlot?.timings?.[0]);
		start.setDate(selectedDate.getDate());
		start.setMonth(selectedDate.getMonth());
		start.setFullYear(selectedDate.getFullYear());

		const timingEnd = DateTimeUtils.timeStingToDate(timeSlot?.timings?.[timeSlot?.timings?.length - 1]);
		timingEnd.setDate(selectedDate.getDate());
		timingEnd.setMonth(selectedDate.getMonth());
		timingEnd.setFullYear(selectedDate.getFullYear());

		const end = new Date(absence.startedAt);
		end.setDate(selectedDate.getDate());
		end.setMonth(selectedDate.getMonth());
		end.setFullYear(selectedDate.getFullYear());

		const endAbsenceDate = new Date(absence.endedAt);
		endAbsenceDate.setDate(selectedDate.getDate());
		endAbsenceDate.setMonth(selectedDate.getMonth());
		endAbsenceDate.setFullYear(selectedDate.getFullYear());
		const minutes = getDurationMinutes(DateTimeUtils.UTCDateToLocalDate(start, true), DateTimeUtils.UTCDateToLocalDate(end, true), false);
		if (minutes < 0 && DateTimeUtils.UTCDateToLocalDate(start)?.getTime() < DateTimeUtils.UTCDateToLocalDate(endAbsenceDate)?.getTime()) {
			return PIXELS_PER_MIN;
		}
		return minutes * PIXELS_PER_MIN;
	}
}
