import { AbstractControl } from '@angular/forms';
import { TimeSlot, TimeSlotFormValues } from '../models/time-slot.model';
import { DateTimeUtils } from './date-time.utils';

export class TimeSlotUtils {
	public static getFormRequestBody(formValues: TimeSlotFormValues): TimeSlot[] {
		const timeSlots: TimeSlot[] = [];

		Object.values(formValues.timeSlotGroup).forEach((values) => {
			values.forEach((value) => {
				if (value.dayStart && value.dayEnd) {
					timeSlots.push({
						dayStart: DateTimeUtils.LocalToUTCTimeTimeString(value.dayStart),
						dayEnd: DateTimeUtils.LocalToUTCTimeTimeString(value.dayEnd),
						weekday: value.weekday,
						...(value.id ? { id: value.id } : {}),
					});
				}
			});
		});

		return timeSlots;
	}

	public static isFormValid(formArrays): boolean {
		for (let i = 0; i < formArrays.length; i++) {
			for (let j = 0; j < formArrays[i].length; j++) {
				const controls = formArrays[i].controls[j] as AbstractControl;

				if (controls.invalid) {
					return false;
				}

				if ((controls.value.dayStart && !controls.value.dayEnd) || (!controls.value.dayStart && controls.value.dayEnd)) {
					return false;
				}
			}
		}

		return true;
	}
}
