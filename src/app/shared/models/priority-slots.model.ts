import { PriorityType, RepeatType } from "./absence.model";

export interface PrioritySlot {
  id: number;
  startedAt: string;
  endedAt: string;
  slotStartTime: string;
  slotEndTime: string;
  priority: PriorityType;
  isRepeat: boolean;
  repeatType: RepeatType;
  repeatFrequency: number;
  repeatDays: string;
  userList: number[];
}
