import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Weekday } from '../models/calendar.model';

@Pipe({
	name: 'weekdayToName',
})
export class WeekdayToNamePipe implements PipeTransform {
	private weekdays = {
		0: 'Sunday',
		1: 'Monday',
		2: 'Tuesday',
		3: 'Wednesday',
		4: 'Thursday',
		5: 'Friday',
		6: 'Saturday',
		7: 'Sunday',
	};

	constructor(private translateService: TranslateService) {}

	public transform(weekday: Weekday | any[], short = false, startWithSunday = false): any {
		if (typeof weekday === 'number') {
			switch (weekday) {
				case Weekday.SUN:
				case Weekday.MON:
				case Weekday.TUE:
				case Weekday.WED:
				case Weekday.THU:
				case Weekday.FRI:
				case Weekday.SAT:
					return short ? this.weekdays[weekday].slice(0, 3) : this.weekdays[weekday];
				default:
					if (startWithSunday && weekday === 7) {
						return short ? this.weekdays[weekday].slice(0, 3) : this.weekdays[weekday];
					}
					return '';
			}
		} else if (Array.isArray(weekday)) {
			return this.weekdayMap(weekday, short);
		}
		return '';
	}

	private weekdayMap(weekday: any, short:boolean) {
		return weekday.map((d: number) =>
			short ? this.translateService.instant(this.weekdays[d].slice(0, 3)) : this.translateService.instant(this.weekdays[d]),
		) as string[];
	}
}
