import { UserType } from './user.model';
import { PracticeAvailability } from './practice.model';
import { NameValue } from '../components/search-modal.component';

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

export interface StaffsGroupedByType {
  radiologists: NameValue[];
  assistants: NameValue[];
  nursing: NameValue[];
  secretaries: NameValue[];
}
