import { Status } from './status.model';
import { PracticeAvailability } from './practice.model';
import { Exam } from './exam.model';

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
	fullName: string;
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
	exams?: Exam[];
	rights?: any[];
	rizivNumber?: string;
	isMandate: boolean;
	examId: number;
	userAzureId: string | null;
	userRole?: any;
	gblUserTypeId?: number;
}

export enum UserRoleEnum {
	Admin = 'admin',
	GeneralUser = 'general_user',
	Reader = 'reader',
}

export interface AddUserRequest {
	firstname?: string;
	lastname?: string;
	email?: string;
	userAzureId?: string;
	id?: number;
	userRole?: string;
	userType: string;
	status: Status;
}

export interface UserBase {
	id: number;
	firstname: string;
	lastname: string;
	fullName: string;
	email: string;
	status: Status;
	userType: UserType;
	userRole?: UserRoleEnum;
	telephone?: string | number;
}

/*
 * Auth User models ---
 */

export interface SchedulerUser {
	id: string;
	email: string;
	givenName: string;
	surname: string;
	displayName: string;
	isExternal: boolean;
	accountEnabled: boolean;
	userRole: UserRoleEnum;
	properties?: any;
}

export interface UserListResponse {
	items: SchedulerUser[];
	count: number;
	hasMoreItems: boolean;
	continuationToken: string | null;
}

export class AuthUser {
	mail: string = '';

	givenName: string = '';

	surname: string = '';

	email: string = '';

	displayName: string = '';

	id: string = '';

	properties: Record<string, string> = {};

	tenantIds: string[] = [];

	constructor(
		mail: string,
		givenName: string,
		id: string,
		surname: string,
		displayName: string,
		email: string,
		properties: Record<string, string>,
		tenantIds: string[],
	) {
		this.mail = mail;
		this.givenName = givenName;
		this.id = id;
		this.properties = properties;
		this.tenantIds = tenantIds;
		this.surname = surname;
		this.displayName = displayName;
		this.email = email;
	}
}
