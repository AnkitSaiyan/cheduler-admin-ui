export enum Weekday {
	SUN,
	MON,
	TUE,
	WED,
	THU,
	FRI,
	SAT,
	ALL,
}

export interface TimeSlot {
	id?: number;
	dayStart: string;
	dayEnd: string;
	weekday?: Weekday;
}

export interface WeekWisePracticeAvailability {
	slotNo: number;
	monday: TimeSlot;
	tuesday: TimeSlot;
	wednesday: TimeSlot;
	thursday: TimeSlot;
	friday: TimeSlot;
	saturday: TimeSlot;
	sunday: TimeSlot;
}

export declare type TimeDurationType = 'Minutes' | 'Hours' | 'Days';

export enum Month {
	JAN = 1,
	FEB,
	MAR,
	APR,
	MAY,
	JUN,
	JUL,
	AUG,
	SEP,
	OCT,
	NOV,
	DEC,
}

export enum MonthFull {
	JANUARY = 1,
	FEBRUARY,
	MARCH,
	APRIL,
	MAY,
	JUNE,
	JULY,
	AUGUST,
	SEPTEMBER,
	OCTOBER,
	NOVEMBER,
	DECEMBER,
}

export interface DateDistributed {
	day: number;
	month: number;
	year: number;
}

export function getDaysOfMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

export function getWeekdayOfDay(date: Date, day: number): number {
	const newDate = new Date(date);
	return new Date(newDate.getFullYear(), newDate.getMonth(), day).getDay();
}

export function getDateOfMonth(year: number, month: number, day = 0): number {
	return new Date(year, month, day).getDate();
}

export function getWeekdayWiseDays(date: Date, startFromSunday = false): number[][] {
	const year: number = date.getFullYear();
	const month: number = date.getMonth();
	const days: number = getDaysOfMonth(year, month);
	const currentWeekday: number = getWeekdayOfDay(date, 1);

	const daysMatrix: number[][] = [];

	let daysRow: number[] = [];

	for (let weekday = startFromSunday ? 0 : 1; weekday < currentWeekday; weekday++) {
		daysRow.push(getDateOfMonth(year, month, weekday - currentWeekday + 1) + 31);
	}

	if (currentWeekday === 0) {
		if (!startFromSunday) {
			// get previous month dates
			for (let weekday = 1; weekday < 7; weekday++) {
				daysRow.push(getDateOfMonth(year, month, weekday + 1 - 7) + 31);
			}
		}
	}

	for (let day = 1; day <= days; day++) {
		if (daysRow.length === 7) {
			daysMatrix.push(daysRow);
			daysRow = [];
		}

		daysRow.push(day);
	}

	// if days end before the last week then adding days of next month
	let day = 1 + 31;
	while (daysRow.length < 7) {
		daysRow.push(day++);
	}

	daysMatrix.push(daysRow);

	return daysMatrix;
}

export function getAllDaysOfWeek(date: Date, sundayFirst: boolean = false): Array<[number, number, number]> {
	const day = date.getDay();
	let weekDay = day;
	if (!sundayFirst) {
		weekDay = day === 0 ? 6 : day - 1;
	}
	const dates: Date[] = [];
	const dateDistributed: Array<[number, number, number]> = [];
	// console.log(weekDay, date);

	const updateDate = (num) => {
		const d: Date = new Date(date);
		d.setDate(date.getDate() + num);
		dates.push(d);
		dateDistributed.push([d.getDate(), d.getMonth(), d.getFullYear()]);
	};

	let w = 0;

	for (w = 0; w < weekDay; w++) {
		updateDate(w - weekDay);
	}

	for (w = weekDay; w <= 6; w++) {
		updateDate(w - weekDay);
	}

	return dateDistributed;
}

export function getDurationMinutes(start: Date, end: Date, isAbsolute: boolean = true): number {
	if (start && end) {
		const startDate = new Date(start);
		const endDate = new Date(end);

		const startH = startDate.getHours();
		const endH = endDate.getHours();

		// if (endH === 0) {
		//   endH = 24;
		// }

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

	return 0;
}

export function stringToTimeArray(timeString: string | undefined, splitBy: string = ':'): number[] {
	if (!timeString) {
		return [0, 0, 0];
	}

	const timeStringArray = timeString.split(splitBy);

	const hour = timeStringArray.length && !Number.isNaN(+timeStringArray[0]) ? +timeStringArray[0] : 0;
	const min = timeStringArray.length > 1 && !Number.isNaN(+timeStringArray[1]) ? +timeStringArray[1] : 0;
	const second = timeStringArray.length > 2 && !Number.isNaN(+timeStringArray[2]) ? +timeStringArray[2] : 0;

	return [hour, min, second];
}

export interface Interval {
	dayStart: string;
	dayEnd: string;
}

export interface CalenderTimeSlot {
	timings: string[];
	intervals: Interval[];
}
