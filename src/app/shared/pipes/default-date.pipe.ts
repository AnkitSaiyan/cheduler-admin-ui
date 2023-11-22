import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { GlobalDateFormat, GlobalDateTimeFormat, GlobalTimeFormat } from '../utils/const';

declare type FormatType = 'date' | 'time' | 'datetime';

@Pipe({
	name: 'dfmDefaultDate',
})
export class DefaultDatePipe implements PipeTransform {
	constructor(private datePipe: DatePipe) {}

	public transform(date: Date | string, formatType: FormatType = 'datetime'): string {
		switch (formatType) {
			case 'date':
				return this.datePipe.transform(date, GlobalDateFormat) as string;
			case 'time':
				return this.datePipe.transform(date, GlobalTimeFormat) as string;
			case 'datetime':
				return this.datePipe.transform(date, GlobalDateTimeFormat) as string;
			default:
				return '';
		}
	}
}
