import { AvailabilityType, User } from './user.model';
import { Status } from './status.model';
import { Room } from './rooms.model';
import { TimeSlot } from './common.modal';
import { BodyType } from '../utils/const';
import { BodyPart } from './body-part.model';

export interface Exam {
	id: number;
	name: string;
	expensive: number;
	bodyPart: string;
	bodyType: BodyType;
	info: string;
	availabilityType: AvailabilityType;
	bodyPartDetails: BodyPart[];
	count?: number;
	status: Status;
	users?: User[];
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
	resourcesBatch: ResourceBatch[];
	assistantCount?: number;
	radiologistCount?: number;
	nursingCount?: number;
	secretaryCount?: number;
	availabilityText?: any;
	usersList?: any;
	mandatoryUsers?: any;
	roomsList?: any;
	statusText?: any;
}

export interface ResourceBatch {
	batchId: number;
	batchName: string;
	roomOrder: number;
	roomDuration: number;
	assistantCount: number;
	radiologistCount: number;
	nursingCount: number;
	secretaryCount: number;
	userList: number[];
	users: User[];
	roomList: number[];
	rooms: Room[];
	examResourceUsersList?: User[];
	appointmentResourcebatchId?: number;
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
	resourcesBatch: {
		batchName: string;
		roomOrder: number;
		roomList: number[] | string[];
		roomduration: number;
		assistantCount: number;
		radiologistCount: number;
		nursingCount: number;
		secretaryCount: number;
		userList: number[];
		mandatoryUsers: number[];
	}[];
	info?: string;
	instructions?: string;
	uncombinables?: number[];
	availabilityType: AvailabilityType;
	practiceAvailability: TimeSlot[];
	status: Status;
	id?: number;
}
