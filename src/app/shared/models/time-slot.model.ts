import { Weekday } from './calendar.model';

export interface TimeSlotFormValues {
	selectedWeekday: Weekday;
	timeSlotGroup: {
		[key: string]: {
			id?: number;
			weekday: Weekday;
			dayStart: string;
			dayEnd: string;
		}[];
	};
}

export interface TimeSlotStaff {
	id?: number;
	weekday: Weekday;
	dayStart: string;
	dayEnd: string;
	isRange: boolean;
	rangeIndex: number;
	rangeFromDate?: Date | string | null;
	rangeToDate?: Date | string | null;
}

export interface TimeSlot {
	id?: number;
	dayStart: string;
	dayEnd: string;
	weekday: Weekday;
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

export interface WeekdayTimeSlot<T> {
	[key: string]: T;
}

