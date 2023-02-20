import { Status } from './status.model';
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
  endedAt?: Date;
  priority: PriorityType;
  info: string;
  status: Status;
  isRepeat?: boolean;
  repeatType?: RepeatType;
  repeatFrequency?: number;
  repeatDays?: string;
  roomList: number[];
  userList: number[];
  rooms: Room[];
  user: User[];
}

export interface AddAbsenceRequestDate {
  name: string;
  isHoliday: boolean;
  startedAt: string;
  endedAt: string | null;
  priority: PriorityType;
  info: string;
  isRepeat: boolean;
  roomList: number[];
  userList: number[];
  repeatType: RepeatType | null;
  repeatFrequency?: number;
  repeatDays?: string;
  status?: Status;
  id?: number;
}
