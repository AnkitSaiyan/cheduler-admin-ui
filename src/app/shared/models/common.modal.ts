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
