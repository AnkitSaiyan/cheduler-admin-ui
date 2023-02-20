import { Status } from './status.model';
import { PracticeAvailability } from './practice.model';

export enum AvailabilityType {
  Unavailable,
  Available,
}

export enum UserType {
  Scheduler = 'Scheduler',
  General = 'General',
  Radiologist = 'Radiologist',
  Nursing = 'Nursing',
  Assistant = 'Assistant',
  Secretary = 'Secretary',
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string | number;
  address: string;
  availabilityType: AvailabilityType | null;
  gsm: string;
  status: Status;
  deletedBy: number | null;
  userType: UserType;
  examList: number[];
  practiceAvailability: PracticeAvailability[];
  info?: string;
  exams?: any[];
  rights?: any[];
  rizivNumber?: string;
  isMandate: boolean;
}
