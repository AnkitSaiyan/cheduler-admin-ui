import { AvailabilityType, User } from './user.model';
import { Status } from './status';
import { Room, RoomType } from './rooms.model';
import { WeekdayModel } from './weekday.model';
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
  usersList: number[];
  roomsForExam: {
    duration: number;
    roomId: number;
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
  practiceAvailability: PracticeAvailability[];
  id?: number;
}
