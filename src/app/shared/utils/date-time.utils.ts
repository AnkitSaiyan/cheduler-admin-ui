import { Appointment } from '../models/appointment.model';

interface DateDistributed {
	day: number;
	month: number;
	year: number;
}

export class DateTimeUtils {
	public static DateDistributedToString(date: DateDistributed | Date, separator = '-'): string {
		if (date instanceof Date) {
			return this.DateDistributedToString(this.DateToDateDistributed(date));
		}
		return `${date.year}${separator}${date.month}${separator}${date.day}`;
	}

	public static DateToDateDistributed(date: Date): DateDistributed {
		if (!date) {
			return {} as DateDistributed;
		}

		return {
			year: new Date(date).getFullYear(),
			month: new Date(date).getMonth() + 1,
			day: new Date(date).getDate(),
		};
	}

	public static DateDistributedToDate(date: DateDistributed): Date {
		return new Date(this.DateDistributedToString(date));
	}

	public static DateTo24TimeString(date: Date): string {
		if (!date) {
			return '';
		}

		const newDate = new Date(date);

		const minutes = newDate.getMinutes().toString();

		return `${newDate.getHours()}:${minutes.length < 2 ? '0' + minutes : minutes}:00`;
	}

	public static TimeStringIn24Hour(timeString: string | undefined): string {
		let time = '';

		if (timeString) {
			const hour = +timeString.slice(0, 2);
			if (timeString.toLowerCase().includes('pm')) {
				if (hour < 12) {
					time = `${hour + 12}:${timeString.slice(3, 5)}`;
				} else {
					time = `${hour}:${timeString.slice(3, 5)}`;
				}
			} else if (timeString.toLowerCase().includes('am')) {
				if (hour === 12) {
					time = `00:${timeString.slice(3, 5)}`;
				} else {
					time = timeString.slice(0, 5);
				}
			} else {
				return timeString.slice(0, 5);
			}
		}

		return time;
	}

	public static DurationInMinFromHour(hour: number, minute = 0): number {
		return hour * 60 + minute;
	}

	public static FormatTime(timeString: string, format: 12 | 24 = 12, interval = 30): string {
		if (!timeString) {
			return '';
		}
		const [hourPart, minutePart]: string[] = timeString.split(':');
		if (hourPart?.length !== 2 || minutePart?.length < 2 || isNaN(+hourPart) || isNaN(+minutePart.slice(0, 2))) {
			return '';
		}
		let ap = '';
		if (format === 12) {
			ap = +hourPart >= 12 && +hourPart < 24 ? 'PM' : 'AM';
		}
		let minuteInInterval = +minutePart.slice(0, 2);
		if (minuteInInterval < 60 && minuteInInterval % interval) {
			minuteInInterval -= minuteInInterval % interval;
		}
		const floorVal = Math.floor(format === 12 ? +hourPart % 12 : +hourPart);
		const hour = hourPart === '12' ? hourPart : `0${floorVal}`.slice(-2);
		const min = minuteInInterval > 60 ? '00' : `0${minuteInInterval}`.slice(-2);
		return format === 12 ? `${hour}:${min}${ap}` : `${hour}:${min}`;
	}

	public static TimeToNumber(timeString: string): number {
		if (timeString?.includes(':')) {
			const timeInNo = +timeString.split(':').join('');

			if (!isNaN(timeInNo)) {
				return timeInNo;
			}
		}

		return 0;
	}

	public static CheckTimeRangeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
		// debugger
		const a = this.TimeToNumber(start1);
		const b = this.TimeToNumber(end1);

		const c = this.TimeToNumber(start2);
		const d = this.TimeToNumber(end2);

		return !(b <= c || d <= a);
	}

	public static UTCDateToLocalDate(utcDate: Date, changeDate: boolean = false): Date {
		if (!utcDate) {
			return utcDate;
		}

		const newDate = new Date();
		newDate.setTime(utcDate.getTime() - utcDate.getTimezoneOffset() * 60 * 1000);
		if (!changeDate) {
			newDate.setDate(utcDate.getDate());
			newDate.setMonth(utcDate.getMonth());
			newDate.setFullYear(utcDate.getFullYear());
		}
		return newDate;
	}

	public static LocalDateToUTCDate(localDate: Date, changeDate: boolean = false): Date {
		if (!localDate) {
			return localDate;
		}

		const newDate = new Date();
		newDate.setTime(localDate.getTime() + localDate.getTimezoneOffset() * 60 * 1000);

		if (!changeDate) {
			newDate.setDate(localDate.getDate());

			newDate.setMonth(localDate.getMonth());
			newDate.setFullYear(localDate.getFullYear());
		}

		return newDate;
	}

	public static UTCTimeToLocalTimeString(timeString: string): string {
		if (!timeString) {
			return timeString
		}

		if (timeString.split(':').length < 2) {
			return timeString;
		}

		// generating utc date from time string
		const hour = +timeString.split(':')[0];
		const min = +timeString.split(':')[1];
		const utcDate = new Date();
		utcDate.setHours(hour);
		utcDate.setMinutes(min);

		// getting local date and time zone difference offset in minutes
		const localDate = new Date();
		const offsetMinutes = localDate.getTimezoneOffset();
		localDate.setTime(utcDate.getTime() - offsetMinutes * 60 * 1000);

		const localHour = `0${localDate.getHours()}`.slice(-2);
		const localMin = `0${localDate.getMinutes()}`.slice(-2);

		return `${localHour}:${localMin}`;
	}

	public static LocalToUTCTimeTimeString(timeString: string): string {
		if (timeString.split(':').length < 2) {
			return timeString;
		}

		// generating utc date from time string
		const hour = +timeString.split(':')[0];
		const min = +timeString.split(':')[1];
		const utcDate = new Date();
		utcDate.setHours(hour);
		utcDate.setMinutes(min);

		// getting local date and time zone difference offset in minutes
		const localDate = new Date();
		const offsetMinutes = localDate.getTimezoneOffset();
		localDate.setTime(utcDate.getTime() + offsetMinutes * 60 * 1000);

		const localHour = `0${localDate.getHours()}`.slice(-2);
		const localMin = `0${localDate.getMinutes()}`.slice(-2);

		return `${localHour}:${localMin}`;
	}

	public static formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const seconds = String(date.getSeconds()).padStart(2, '0');

		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

	public static timeStingToDate(date: string): Date {
    if (!date) {
			return new Date();
		}
		const formattedDate = new Date();
		const splitDate = date?.split(':');
		formattedDate.setHours(+splitDate[0]);
		formattedDate.setMinutes(+splitDate[1]);
		formattedDate.setSeconds(0);
		formattedDate.setMilliseconds(0);
		return formattedDate;
	}

	public static extendMinutesInBottom(appointment: Appointment, timeSlot: any): number {
		const appointmentEnd = DateTimeUtils.UTCTimeToLocalTimeString(appointment.endedAt.toString().split(' ')[1]).split(':');
		const calendarEnd = DateTimeUtils.UTCTimeToLocalTimeString(timeSlot?.intervals[timeSlot.intervals.length - 1].dayEnd).split(':');
		const appointmentEndInMin = DateTimeUtils.DurationInMinFromHour(+appointmentEnd[0], +appointmentEnd[1]);
		let calendarEndInMin = DateTimeUtils.DurationInMinFromHour(+calendarEnd[0], +calendarEnd[1]);
		calendarEndInMin = calendarEndInMin + 120 > 1440 ? 1440 : calendarEndInMin + 120;
		return calendarEndInMin - appointmentEndInMin;
	}
}
