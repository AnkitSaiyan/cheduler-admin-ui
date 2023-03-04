import { AvailabilityType } from './user.model';
import { Status } from './status.model';
import { PracticeAvailability } from './practice.model';

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
  practiceAvailability: PracticeAvailability[];

  examId: number;
  roomNo?: number;
  examLists?: number[];
}

export interface AddRoomRequestData {
  name: string;
  description: string;
  type: RoomType;
  placeInAgenda: number;
  status?: Status;
  availabilityType: AvailabilityType;
  roomNo?: number;
  practiceAvailability?: PracticeAvailability[];
  id?: number;
}

export interface RoomsGroupedByType {
  public: Room[];
  private: Room[];
}

export interface UpdateRoomPlaceInAgendaRequestData {
  id: number;
  placeInAgenda: number;
}
