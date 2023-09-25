import { AvailabilityType, User } from './user.model';
import { Status } from './status.model';
import { Room, RoomType } from './rooms.model';
import {TimeSlot, Weekday} from './calendar.model';
import { PracticeAvailability } from './practice.model';
import { BodyType } from '../utils/const';

export interface Exam {
	id: number;
	name: string;
	expensive: number;
	bodyPart: string;
	bodyType: BodyType;
	info: string;
	assistantCount: number;
	radiologistCount: number;
	nursingCount: number;
	secretaryCount: number;
	availabilityType: AvailabilityType;
	count?: number;
	status: Status;
	users?: User[];
	usersList: number[];
	mandatoryUsers: number[];
	roomsForExam: {
		duration: number;
		roomId: number;
		name: string;
	}[];
	rooms?: Room[];
	uncombinables?: number[];
	uncombinablesExam: Uncombinables[];
	startedAt: Date;
	endedAt: Date;
	practiceAvailability?: any[];
	instructions: string;
	allUsers?: User[];
}

export interface Uncombinables {
	name: string;
	id: number;
}

export interface CreateExamRequestData {
	name: string;
	expensive: number;
	bodyType: string;
	bodyPart: string[] | number[];
	roomsForExam: {
		roomId: number;
		duration: number;
	}[];
	info?: string;
	instructions?: string;
	uncombinables?: number[];
	assistantCount: number;
	radiologistCount: number;
	nursingCount: number;
	secretaryCount: number;
	usersList: number[];
	mandatoryUsers: number[];
	availabilityType: AvailabilityType;
	practiceAvailability: TimeSlot[];
	status: Status;
	id?: number;
}
