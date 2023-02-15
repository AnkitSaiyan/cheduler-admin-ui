import { Status } from './status.model';

export interface Physician {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  address: string;
  rizivNumber: string;
  telephone: number;
  gsm: string;
  notifyDoctor: boolean;
  count?: number;
  status?: Status;
}

export interface AddPhysicianRequestData {
  firstname: string;
  lastname: string;
  email: string | null;
  address: string;
  rizivNumber: string;
  telephone: number;
  gsm: string;
  notifyDoctor: boolean;
  status: Status;
  id?: number;
}
