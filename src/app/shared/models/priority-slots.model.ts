import { PriorityType, RepeatType } from './absence.model';
import { User } from './user.model';

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
	slotEndTime: string;
	nxtSlotOpenPct: number | null;
}

export interface NextSlotOpenPercentageData {
	highPriorityPercentage: number;
	mediumPriorityPercentage: number;
	lowPriorityPercentage: number;
}


