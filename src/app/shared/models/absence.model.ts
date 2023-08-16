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

export interface Absence {
	id: number;
	absenceId: number;
	name: string;
	isHoliday: boolean;
	startedAt: string | Date;
	endedAt: string | Date;
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
}

export type AddAbsenceRequestData = Prettify<PartialBy<Omit<Absence, 'rooms' | 'user'>, 'id' | 'status' | 'absenceId'>>;

