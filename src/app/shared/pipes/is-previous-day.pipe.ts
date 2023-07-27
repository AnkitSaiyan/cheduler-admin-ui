import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'isPreviousDay',
})
export class IsPreviousDayPipe implements PipeTransform {
	transform(value: Date, compareWithTime: boolean = false): boolean {
		const currentDate = new Date();
		if (!compareWithTime) currentDate.setHours(0, 0, 0, 0);
		return value.getTime() < currentDate.getTime();
	}
}



