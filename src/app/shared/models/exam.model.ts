import { AvailabilityType, User } from './user.model';
import { Status } from './status.model';
import { Room, RoomType } from './rooms.model';
import { Weekday } from './calendar.model';
import { PracticeAvailability } from './practice.model';

export interface Exam {
  id: number;
  name: string;
  expensive: number;
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
  roomsForExam: {
    duration: number;
    roomId: number;
    name: string;
  }[];
  rooms?: Room[];
  uncombinables?: number[];
  practiceAvailability?: any[];
}

export interface CreateExamRequestData {
  name: string;
  expensive: number;
  roomsForExam: {
    roomId: number;
    duration: number;
  }[];
  info?: string;
  uncombinables?: number[];
  assistantCount: number;
  radiologistCount: number;
  nursingCount: number;
  secretaryCount: number;
  usersList: number[];
  availabilityType: AvailabilityType;
  practiceAvailability: PracticeAvailability[];
  status: Status;
  id?: number;
}
