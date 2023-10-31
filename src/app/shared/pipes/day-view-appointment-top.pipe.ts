import { Pipe, PipeTransform } from '@angular/core';
import { PIXELS_PER_MIN } from '../utils/const';
import { getDurationMinutes } from '../models/calendar.model';
import { DateTimeUtils } from '../utils/date-time.utils';
import { Appointment } from '../models/appointment.model';

@Pipe({
	name: 'dayViewAppointmentTop',
})
export class DayViewAppointmentTopPipe implements PipeTransform {
	transform(appointment: Appointment, selectedDate: Date, timeSlot: any): number {
		const start = DateTimeUtils.timeStingToDate(timeSlot?.timings?.[0]);
		start.setDate(selectedDate.getDate());
		start.setMonth(selectedDate.getMonth());
		start.setFullYear(selectedDate.getFullYear());
		const end = new Date(appointment.startedAt);
		end.setMilliseconds(0);
		const isHiddenAppointmentInBottom = DateTimeUtils.extendMinutesInBottom(appointment, timeSlot) < 0;
		if (start.getTime() > end.getTime() || isHiddenAppointmentInBottom) {
			return -1;
		}
		const minutes = getDurationMinutes(start, end);
		return minutes * PIXELS_PER_MIN;
	}
}


