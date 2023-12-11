import { AvailabilityType, User } from './user.model';
import { Status } from './status.model';
import { PracticeAvailability } from './practice.model';
import { TimeSlot } from './common.modal';
import { PartialBy, Prettify } from '../utils/types';

export enum RoomType {
	Private = 'private',
	Public = 'public',
}

export interface Room {
	id: number;
	name: string;
	placeInAgenda: number;
	description: string;
	type: RoomType;
	availabilityType: AvailabilityType;
	status: Status;
	roomNo?: number;
	practiceAvailability: PracticeAvailability[];
	startedAt?: string | Date;
	endedAt?: string | Date;
	examId: number;
	examLists?: number[];
	exams: any[];
	users?: User[];
}

export type AddRoomRequestData = Prettify<
	PartialBy<Omit<Room, 'exams' | 'examLists' | 'examId' | 'endedAt' | 'startedAt' | 'practiceAvailability'>, 'status' | 'id'> & {
		practiceAvailability: TimeSlot[];
	}
>;

export interface RoomsGroupedByType {
	public: Room[];
	private: Room[];
}

export interface UpdateRoomPlaceInAgendaRequestData {
	id: number;
	placeInAgenda: number;
}
