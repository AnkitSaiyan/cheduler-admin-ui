import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'timeInInterval',
})
export class TimeInIntervalPipe implements PipeTransform {
	public transform(
		interval: number = 30,
		format24: boolean = true,
		formatted: boolean = false,
		startMin: number = 0,
		endMin: number = 24 * 60,
	): string[] {
		const times: string[] = [];
		const ap = ['AM', 'PM'];
		const format = format24 ? 24 : 12;

		for (let startTime = startMin; startTime < endMin; startTime += interval) {
			const hour = Math.floor(startTime / 60);
			const minute = startTime % 60;
			const hourFormat = format === 12 ? hour % format || 12 : hour % format;

			const hourString = hourFormat.toString().padStart(2, '0');
			const minuteString = minute.toString().padStart(2, '0');
			const amPmString = format === 12 ? ap[Math.floor(hour / 12)] : '';

			let time = '';

			if (formatted) {
				time += hourString;

				if (!(interval === 60 && (minuteString === '00' || minuteString === '0'))) {
					time += `:${minuteString}`;
				}

				time += ` ${amPmString}`;
			} else {
				time = `${hourString}:${minuteString}`;
			}

			times.push(time);
		}

		return times;
	}
}
