import { UserType } from './user.model';
import { PracticeAvailability } from './practice.model';
import { NameValue } from '../components/search-modal.component';
import { Status } from './status.model';

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
  status?: Status;
  id?: number;
}

export interface StaffsGroupedByType {
  radiologists: NameValue[];
  assistants: NameValue[];
  nursing: NameValue[];
  secretaries: NameValue[];
  mandatory: NameValue[];
}

export enum StaffType {
  Radiologist = 'Radiologist',
  Nursing = 'Nursing',
  Assistant = 'Assistant',
  Secretary = 'Secretary',
}
