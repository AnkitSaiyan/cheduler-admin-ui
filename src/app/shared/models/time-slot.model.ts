import { NameValue } from '../components/search-modal.component';
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
	rangeFromDate?: Date | null;
	rangeToDate?: Date | null;
}

export interface TimeSlot {
	id?: number;
	dayStart: string;
	dayEnd: string;
	weekday: Weekday;
}





