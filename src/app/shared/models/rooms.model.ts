import { AvailabilityType } from './user.model';
import { Status } from './status';
import { PracticeAvailability } from './practice.model';

export enum RoomType {
  Private = 'private',
  Public = 'public',
}

export interface Room {
  id: number;
  name: string;
  roomNo: number;
  description: string;
  type: RoomType;
  availabilityType: AvailabilityType;
  status: Status;
  placeInAgenda?: number;
  practiceAvailability: PracticeAvailability[];
  examLists?: number[];
}

export interface AddRoomRequestData {
  name: string;
  description: string;
  type: RoomType;
  availabilityType?: AvailabilityType;
  status?: Status;
  roomNo: number;
  placeInAgenda?: number;
  practiceAvailability?: PracticeAvailability[];
  id?: number;
}
