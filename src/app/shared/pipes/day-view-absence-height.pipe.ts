import { Pipe, PipeTransform } from '@angular/core';
import { getDurationMinutes } from '../models/calendar.model';
import { PIXELS_PER_MIN } from '../utils/const';

@Pipe({
	name: 'dayViewAbsenceHeight',
})
export class DayViewAbsenceHeightPipe implements PipeTransform {
	transform(absence: any): any {
		const [startHour, startMinute] = absence.start.split(':');
		const [endHour, endMinute] = absence.end.split(':');
		const startDate = new Date();
		startDate.setHours(+startHour);
		startDate.setMinutes(+startMinute);
		const endDate = new Date();
		endDate.setHours(+endHour);
		endDate.setMinutes(+endMinute);
		const durationMinutes = getDurationMinutes(startDate, endDate);
		return durationMinutes * PIXELS_PER_MIN;
	}
}
