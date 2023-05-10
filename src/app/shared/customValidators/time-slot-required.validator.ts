import { FormControl } from '@angular/forms';

export function timeSlotRequiredValidator(control: FormControl) {
	if (!!control.value?.dayStart && !control.value?.dayEnd) {
		control.get('dayEnd')?.setErrors({ customRequired: true });
	}
	if (!!control.value?.dayEnd && !control.value?.dayStart) {
		control.get('dayStart')?.setErrors({ customRequired: true });
	}
	return null;
}







