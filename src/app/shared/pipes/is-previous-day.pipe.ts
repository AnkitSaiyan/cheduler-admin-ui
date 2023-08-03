import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'isPreviousDay',
})
export class IsPreviousDayPipe implements PipeTransform {
	transform(value: Date | string, compareWithTime: boolean = false): boolean {
		const date = new Date(value);
		const currentDate = new Date();
		if (!compareWithTime) currentDate.setHours(0, 0, 0, 0);
		return date.getTime() < currentDate.getTime();
	}
}






