import { UserType } from './user.model';
import { Weekday } from './weekday';

export interface PracticeAvailabilityRequestData {
  weekday: Weekday;
  dayStart: string;
  dayEnd: string;
}
export interface AddStaffRequestData {
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  address?: string;
  userType: UserType;
  practiceAvailability?: PracticeAvailabilityRequestData[];
  examLists: number[];
  info?: string;
}
