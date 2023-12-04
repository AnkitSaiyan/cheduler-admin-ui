import { PracticeAvailability } from '../models/practice.model';
import { DateTimeUtils } from './date-time.utils';

export class StaffUtils {
	public static StaffDataModification(practiceAvailability: PracticeAvailability[]) {
		const practice = {};
		practiceAvailability.forEach(({ rangeFromDate, rangeToDate, isRange, rangeIndex, ...availability }) => {
			if (practice?.[rangeIndex]) {
				practice[rangeIndex] = {
					...practice?.[rangeIndex],
					practice: [
						...(practice?.[rangeIndex]?.practice ?? {}),
						{
							...availability,
							dayStart: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayStart),
							dayEnd: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayEnd),
						},
					],
				};
			} else {
				practice[rangeIndex] = {
					rangeFromDate: rangeFromDate ? DateTimeUtils.UTCDateToLocalDate(new Date(rangeFromDate), true) : null,
					rangeToDate: rangeToDate ? DateTimeUtils.UTCDateToLocalDate(new Date(rangeToDate), true) : null,
					isRange,
					rangeIndex,
					practice: [
						{
							...availability,
							dayStart: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayStart),
							dayEnd: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayEnd),
						},
					],
				};
			}
		});
		return practice;
	}
}
