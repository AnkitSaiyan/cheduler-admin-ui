import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'numberToDate',
})
export class NumberToDatePipe implements PipeTransform {
	public transform(day: number, month: number, year: number): Date {
		return new Date(day, month, year);
	}
}
