import { PriorityType, RepeatType } from "./absence.model";
import { Status } from "./status.model";
import { User } from "./user.model";

export interface PrioritySlot {
  id?: number;
  startedAt: string;
  endedAt: string;
  priority: PriorityType;
  isRepeat: boolean;
  repeatType: RepeatType | null;
  repeatFrequency: number;
  repeatDays: string;
  userList: number[];
  users: User[];
  slotStartTime: string;
  slotEndTime: string | null;
}
export enum prioritySlot {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}

