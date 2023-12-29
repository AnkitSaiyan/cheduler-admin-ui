import { Params } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DateTimeUtils } from '../utils/date-time.utils';
import { Absence, RepeatType } from './absence.model';

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
	rangeFromDate?: Date | null;
	rangeToDate?: Date | null;
	isRange?: boolean;
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
	const dateDistributed: Array<[number, number, number]> = [];
	//

	const updateDate = (num) => {
		const d: Date = new Date(date);
		d.setDate(date.getDate() + num);
		dateDistributed.push([d.getDate(), d.getMonth(), d.getFullYear()]);
	};

	let w = 0;

	for (w; w < weekDay; w++) {
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

	const hour = timeStringArray.length && !isNaN(+timeStringArray[0]) ? +timeStringArray[0] : 0;
	const min = timeStringArray.length > 1 && !isNaN(+timeStringArray[1]) ? +timeStringArray[1] : 0;
	const second = timeStringArray.length > 2 && !isNaN(+timeStringArray[2]) ? +timeStringArray[2] : 0;

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

export function calendarDistinctUntilChanged(preQueryParam: Params, currQueryParam: Params): boolean {
	if (preQueryParam['v'] !== currQueryParam['v']) return false;

	const [currYear, currMonth, currDay] = currQueryParam['d'].split('-');

	const [preYear, preMonth, preDay] = preQueryParam['d'].split('-');

	const currDate = new Date(currYear, currMonth - 1, currDay, 0, 0, 0, 0);

	const preDate = new Date(preYear, preMonth - 1, preDay, 0, 0, 0, 0);

	switch (true) {
		case currQueryParam['v'] === 'm':
			if (currMonth !== preMonth || currYear !== preYear) {
				return false;
			}
			return true;
		case currQueryParam['v'] === 'w': {
			if (currMonth !== preMonth || currYear !== preYear) {
				return false;
			}
			const firstDayOfPreWeek = new Date().setDate(preDate.getDate() - (preDate.getDay() ? preDate.getDay() : 7));

			const firstDayOfCurrWeek = new Date().setDate(currDate.getDate() - (currDate.getDay() ? currDate.getDay() : 7));

			if (firstDayOfPreWeek !== firstDayOfCurrWeek) {
				return false;
			}
			return true;
		}
		default:
			return false;
	}
}

export function getFromAndToDate(queryParam: Params, isHoliday: boolean = false) {
	const [year, month, day] = queryParam['d'].split('-');

	const currDate = new Date(+year, +month - 1, +day, 0, 0, 0, 0);

	let fromDate: string;

	let toDate: string;
	switch (true) {
		case queryParam['v'] === 'm':
		case isHoliday:
			fromDate = DateTimeUtils.DateDistributedToString(new Date(+year, +month - 1, 1), '-');

			toDate = DateTimeUtils.DateDistributedToString(new Date(+year, +month, 0), '-');

			return { fromDate, toDate };
		case queryParam['v'] === 'w':
			currDate.setDate(currDate.getDate() - (currDate.getDay() ? currDate.getDay() - 1 : 6));

			fromDate = DateTimeUtils.DateDistributedToString(currDate, '-');

			currDate.setDate(currDate.getDate() + 6);

			toDate = DateTimeUtils.DateDistributedToString(currDate, '-');

			return { fromDate, toDate };
		default:
			return { fromDate: queryParam['d'], toDate: queryParam['d'] };
	}
}

export function dataModification(absence, datePipe: DatePipe) {
	const absenceSlot = {};
	absence
		?.map((value: any) => ({
			...value,
			startedAt: value.startedAt,
			endedAt: value.endedAt,
			slotStartTime: datePipe.transform(value.startedAt, 'HH:mm:ss'),
			slotEndTime: datePipe.transform(value.endedAt, 'HH:mm:ss'),
			isHoliday: value.isHoliday,
		}))
		?.forEach((absenceItem: any) => {
			let { repeatFrequency } = absenceItem;
			const { absenceId, name, info, startedAt, endedAt, roomName, userName, isHoliday } = absenceItem;
			const startDate = new Date(new Date(new Date(absenceItem.startedAt)).toDateString());
			let firstDate = new Date(new Date(new Date(absenceItem.startedAt)).toDateString());
			const lastDate = new Date(new Date(new Date(absenceItem.endedAt)).toDateString());
			switch (true) {
				case !absenceItem.isRepeat:
				case absenceItem.repeatType === RepeatType.Daily: {
					repeatFrequency = absenceItem.isRepeat ? repeatFrequency : 1;
					while (firstDate.getTime() <= lastDate.getTime()) {
						if (firstDate.getTime() > lastDate.getTime()) break;
						const dateString = datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
						const customPrioritySlot = {
							start: absenceItem.slotStartTime.slice(0, 5),
							end: absenceItem.slotEndTime?.slice(0, 5),
							id: absenceId,
							name,
							info,
							startedAt,
							endedAt,
							roomName,
							userName,
							isHoliday,
						};
						absenceSlot[dateString] = absenceSlot[dateString] ? [...absenceSlot[dateString], customPrioritySlot] : [customPrioritySlot];
						firstDate.setDate(firstDate.getDate() + repeatFrequency);
					}
					break;
				}
				case absenceItem.repeatType === RepeatType.Weekly: {
					const closestSunday = new Date(startDate.getTime() - startDate.getDay() * 24 * 60 * 60 * 1000);
					firstDate = new Date(closestSunday);
					while (closestSunday.getTime() <= lastDate.getTime()) {
						absenceItem.repeatDays.split(',').forEach((day) => {
							firstDate.setTime(closestSunday.getTime());
							firstDate.setDate(closestSunday.getDate() + +day);
							if (firstDate.getTime() >= startDate.getTime() && firstDate.getTime() <= lastDate.getTime()) {
								const dateString = datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
								const customPrioritySlot = {
									start: absenceItem.slotStartTime.slice(0, 5),
									end: absenceItem.slotEndTime?.slice(0, 5),
									id: absenceId,
									name,
									info,
									startedAt,
									endedAt,
									roomName,
									userName,
									isHoliday,
								};
								absenceSlot[dateString] = absenceSlot[dateString] ? [...absenceSlot[dateString], customPrioritySlot] : [customPrioritySlot];
							}
						});
						if (closestSunday.getTime() >= lastDate.getTime()) break;
						closestSunday.setDate(closestSunday.getDate() + repeatFrequency * 7);
					}
					break;
				}
				case absenceItem.repeatType === RepeatType.Monthly: {
					while (firstDate.getTime() <= lastDate.getTime()) {
						absenceItem.repeatDays.split(',').forEach((day) => {
							if (getDateOfMonth(firstDate.getFullYear(), firstDate.getMonth() + 1, 0) >= +day) {
								firstDate.setDate(+day);
								if (firstDate.getTime() >= startDate.getTime() && firstDate.getTime() <= lastDate.getTime()) {
									const dateString = datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
									const customPrioritySlot = {
										start: absenceItem.slotStartTime.slice(0, 5),
										end: absenceItem.slotEndTime?.slice(0, 5),
										id: absenceId,
										name,
										info,
										startedAt,
										endedAt,
										roomName,
										userName,
										isHoliday,
									};
									absenceSlot[dateString] = absenceSlot[dateString] ? [...absenceSlot[dateString], customPrioritySlot] : [customPrioritySlot];
								}
							}
						});
						if (firstDate.getTime() >= lastDate.getTime()) break;
						firstDate.setMonth(firstDate.getMonth() + repeatFrequency);
					}
					break;
				}
				default:
					break;
			}
		});
	return absenceSlot;
}

export function dataModificationForWeek(absenceSlot: { [key: string]: Absence[] }) {
	let startDate: string;
	let endDate: string;
	let sameGroup: boolean;
	const absenceGroupedByDate = {};

	Object.entries(absenceSlot).forEach(([key, absence]: [string, any]) => {
		let groupedAbsence: any[] = [];
		absence
			.sort((s1, s2) => (DateTimeUtils.TimeToNumber(s1.start) > DateTimeUtils.TimeToNumber(s2.start) ? 1 : -1))
			.forEach((item: any, index) => {
				const dateString = key;
				if (!absenceGroupedByDate[dateString]) {
					absenceGroupedByDate[dateString] = [];
					startDate = item.start;
					endDate = item.end;
					sameGroup = false;
				} else {
					const currSD = item.start;
					const currED = item.end;

					const endTime = new Date();
					endTime.setHours(+endDate.split(':')[0]);
					endTime.setMinutes(+endDate.split(':')[1]);

					const currSDTime = new Date();
					currSDTime.setHours(+currSD.split(':')[0]);
					currSDTime.setMinutes(+currSD.split(':')[1]);

					if (
						(DateTimeUtils.TimeToNumber(currSD) >= DateTimeUtils.TimeToNumber(startDate) &&
							DateTimeUtils.TimeToNumber(currSD) <= DateTimeUtils.TimeToNumber(endDate)) ||
						(DateTimeUtils.TimeToNumber(currSD) > DateTimeUtils.TimeToNumber(endDate) && getDurationMinutes(endTime, currSDTime) <= 1)
					) {
						sameGroup = true;
						if (DateTimeUtils.TimeToNumber(currED) > DateTimeUtils.TimeToNumber(endDate)) {
							endDate = currED;
						}
					} else {
						startDate = currSD;
						endDate = currED;
						sameGroup = false;
					}
				}

				if (!sameGroup) {
					if (index !== 0) {
						groupedAbsence = [];
					}
					absenceGroupedByDate[dateString].push(groupedAbsence);
				}
				groupedAbsence.push(item);
			});
	});
	return absenceGroupedByDate;
}
