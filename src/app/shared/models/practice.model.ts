import { Weekday } from './common.modal';

export interface PracticeAvailability {
	id?: number;
	weekday: Weekday;
	dayStart: string;
	dayEnd: string;
	isRange: boolean;
	rangeIndex: number;
	rangeFromDate?: Date | null;
	rangeToDate?: Date | null;
}

export interface PracticeAvailabilityServer {
	id?: number;
	weekday: Weekday;
	dayStart: string;
	dayEnd: string;
}
