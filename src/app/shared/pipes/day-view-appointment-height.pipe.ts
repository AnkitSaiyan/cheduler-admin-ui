import { Pipe, PipeTransform } from '@angular/core';
import { getDurationMinutes } from '../models/calendar.model';
import { PIXELS_PER_MIN } from '../utils/const';
import { Appointment } from '../models/appointment.model';

@Pipe({
	name: 'dayViewAppointmentHeight',
})
export class DayViewAppointmentHeightPipe implements PipeTransform {
	transform(appointment: Appointment): number {
		const durationMinutes = getDurationMinutes(appointment.startedAt, appointment.endedAt);
		return durationMinutes * PIXELS_PER_MIN;
	}
}
