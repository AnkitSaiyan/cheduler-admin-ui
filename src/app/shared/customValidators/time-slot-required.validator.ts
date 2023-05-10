import { FormControl } from '@angular/forms';

export function timeSlotRequiredValidator(control: FormControl) {
	if (!!control.value?.dayStart || !!control.value?.dayEnd) {
		return !!control.value?.dayStart && !!control.value?.dayEnd ? null : { bothFieldRequired: true };
	}
	return null;
}

