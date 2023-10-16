import { Status } from './status.model';
import { Room } from './rooms.model';
import { User } from './user.model';
import { PartialBy, Prettify } from '../utils/types';

export enum PriorityType {
	Low = 'Low',
	Medium = 'Medium',
	High = 'High',
}

export enum RepeatType {
	Daily = 'daily',
	Weekly = 'weekly',
	Monthly = 'monthly',
}

export enum EndDateType {
	Never = 'never',
	Until = 'until',
}

export interface Absence {
	id: number;
	absenceId: number;
	name: string;
	isHoliday: boolean;
	startedAt: string | Date;
	endedAt: string | Date | null;
	priority: PriorityType;
	info: string;
	status: Status;
	isRepeat?: boolean;
	repeatType?: RepeatType | null;
	repeatFrequency?: number;
	repeatDays?: string;
	roomList?: number[];
	userList?: number[];
	rooms: Room[];
	user: User[];
	userName?: string;
	roomName?: string;
	addAppointmentImpactedAbsence: boolean;
	impactedAppointmentDetails?: [];
}

export type AddAbsenceRequestData = Prettify<PartialBy<Omit<Absence, 'rooms' | 'user' | 'userName' | 'roomName'>, 'id' | 'status' | 'absenceId'>>;

