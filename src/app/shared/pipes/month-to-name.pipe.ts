import { Pipe, PipeTransform } from '@angular/core';
import { Month } from '../models/calendar.model';

@Pipe({
	name: 'monthToName',
})
export class MonthToNamePipe implements PipeTransform {
	private months = {
		1: 'January',
		2: 'February',
		3: 'March',
		4: 'April',
		5: 'May',
		6: 'June',
		7: 'July',
		8: 'August',
		9: 'September',
		10: 'October',
		11: 'November',
		12: 'December',
	};

	public transform(month: Month | any[], short = false): any {
		if (typeof month === 'number') {
			switch (month) {
				case Month.JAN:
				case Month.FEB:
				case Month.MAR:
				case Month.APR:
				case Month.MAY:
				case Month.JUN:
				case Month.JUL:
				case Month.AUG:
				case Month.SEP:
				case Month.OCT:
				case Month.NOV:
				case Month.DEC:
					return (short ? this.months[month].slice(0, 3) : this.months[month]) as string;
				default:
					return '';
			}
		} else if (Array.isArray(month)) {
			return month.map((m: number) => (short ? this.months[m].slice(0, 3) : this.months[m])) as string[];
		}

		return '';
	}
}
