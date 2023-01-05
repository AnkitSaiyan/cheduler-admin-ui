import { AvailabilityType, User } from './user.model';
import { Status } from './status';

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
  status: Status;
  usersList: User[];
  roomsForExam: [];
  uncombinables: [];
  practiceAvailability?: null;
}
