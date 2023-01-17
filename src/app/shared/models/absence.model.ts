import { Status } from './status';
import { Room } from './rooms.model';
import { User } from './user.model';

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
  name: string;
  isHoliday: boolean;
  startedAt: Date;
  endedAt: Date;
  priority: PriorityType;
  info?: string;
  status: Status;
  isRepeat?: boolean;
  repeatType?: RepeatType;
  repeatFrequency?: number;
  repeatDays?: string;
  roomList: number[];
  staffList: number[];
  rooms: Room[];
  staff: User[];
}

export interface AddAbsenceRequestDate {
  name: string;
  isHoliday: boolean;
  startedAt: string;
  endedAt: string;
  priority: PriorityType;
  info: string;
  isRepeat: boolean;
  roomList: number[];
  staffList: number[];
  repeatType?: RepeatType;
  repeatFrequency?: number;
  repeatDays?: string;
  status?: Status;
  id?: number;
}
