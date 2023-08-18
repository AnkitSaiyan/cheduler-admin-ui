import { PartialBy, Prettify } from '../utils/types';
import { Status } from './status.model';

export interface Physician {
	id: number;
	firstname: string;
	lastname: string;
	email: string | null;
	address: string;
	rizivNumber: string;
	telephone: number;
	gsm: string;
	notifyDoctor: boolean;
	count?: number;
	status: Status;
}
export type AddPhysicianRequestData = Prettify<PartialBy<Omit<Physician, 'count'>, 'id'>>;
