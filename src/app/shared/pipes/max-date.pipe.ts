import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'maxDate',
})
export class MaxDatePipe implements PipeTransform {
	transform(value: string | Date, noOfDay?: number): Date {
		const date = value ? new Date(value) : new Date();
		if (noOfDay) {
			date.setDate(date.getDate() + noOfDay);
		}
		return date;
	}
}

