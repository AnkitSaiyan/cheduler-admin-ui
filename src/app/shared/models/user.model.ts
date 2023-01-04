import { Status } from './status';

export enum AvailabilityType {
  Unavailable,
  Available,
}

export enum UserType {
  Scheduler = 'scheduler',
  General = 'General',
  Radiologist = 'radiologist',
  Nursing = 'nursing',
  Assistant = 'assistant',
  Secretary = 'secretary',
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  address: string;
  availabilityType: AvailabilityType | null;
  gsm: string;
  status: Status;
  deletedBy: number | null;
  userType: UserType;
  examList: number[];
  practiceAvailability: null | [] | any;
}
