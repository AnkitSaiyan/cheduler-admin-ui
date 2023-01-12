import { UserType } from './user.model';
import { PracticeAvailability } from './practice.model';

export interface AddStaffRequestData {
  firstname: string;
  lastname: string;
  email: string;
  telephone: string | number;
  address?: string;
  userType: UserType;
  practiceAvailability?: PracticeAvailability[];
  examLists?: number[];
  gsm?: string;
  info?: string;
  id?: number;
}
