import { Status } from './status';

export enum AvailabilityTypes {
  Unavailable,
  Available,
}

export enum UserTypes {
  Scheduler = 'scheduler',
  General = 'General',
  Specialist = 'specialist',
  Nursing = 'nursing',
  Assistant = 'assistant',
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  address: string;
  availabilityType: AvailabilityTypes | null;
  gsm: string;
  status: Status;
  deletedBy: number | null;
  userType: UserTypes;
  examList: number[];
  practiceAvailability: null;
}
