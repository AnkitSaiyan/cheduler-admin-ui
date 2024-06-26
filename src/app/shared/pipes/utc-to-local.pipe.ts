import { Pipe, PipeTransform } from '@angular/core';
import { DateTimeUtils } from '../utils/date-time.utils';

@Pipe({
	name: 'dfmUtcToLocal',
})
export class UtcToLocalPipe implements PipeTransform {
	public transform(utcDateTimeString: Date | string | undefined | null, timeOnly = false, changeDate = false): string {
		if (!utcDateTimeString) {
			return '';
		}

		if (timeOnly) {
			return DateTimeUtils.UTCTimeToLocalTimeString(utcDateTimeString.toString());
		}

		return DateTimeUtils.UTCDateToLocalDate(new Date(utcDateTimeString), changeDate).toString();
	}
}
