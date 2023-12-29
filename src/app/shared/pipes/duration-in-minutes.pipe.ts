import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'durationInMinutes',
})
export class DurationInMinutesPipe implements PipeTransform {
	transform(start: any, end: any, isAbsolute: boolean = true): any {
		if (!start || !end) {
			return 0;
		}
		const startDate = new Date(start);
		const endDate = new Date(end);

		const startH = startDate.getHours();
		const endH = endDate.getHours();

		if (startH === endH) {
			return endDate.getMinutes() - startDate.getMinutes();
		}

		const hours = endH - (startH + 1);
		const minutes = 60 - startDate.getMinutes() + endDate.getMinutes();
		if (isAbsolute) {
			return Math.abs(hours * 60 + minutes);
		}
		return hours * 60 + minutes;
	}
}
