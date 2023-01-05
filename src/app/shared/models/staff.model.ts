import { UserType } from './user.model';
import { PracticeAvailability } from './practice.model';

export interface AddStaffRequestData {
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  address?: string;
  userType: UserType;
  practiceAvailability?: PracticeAvailability[];
  examLists: number[];
  info?: string;
  id?: number;
}
