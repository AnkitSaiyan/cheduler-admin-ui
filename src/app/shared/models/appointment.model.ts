import { Room, RoomType } from './rooms.model';
import { Exam } from './exam.model';
import { User } from './user.model';
import { AppointmentStatus, ReadStatus } from './status.model';

export interface Appointment {
	action?: any;
	id: number;
	createdAt: Date;
	updatedAt: string;
	doctorId: number;
	doctor: string;
	patientFname: string;
	patientLname: string;
	patientEmail: string;
	patientTel: number;
	examName?: string;
	roomType: RoomType;
	comments: string;
	approval: AppointmentStatus;
	rejectReason: string;
	readStatus: ReadStatus;
	startedAt: Date;
	endedAt: Date;
	createdBy: number | null;
	updatedBy: number | null;
	cancelTillTime: string | null;
	user: User;
	userId: number;
	examList: number[];
	exam?: Exam;
	exams: Exam[];
	apmtId: number;
	isCombineExam: boolean;
	roomsDetail: Room[];
	usersDetail: User[];
	patientAzureId?: string;
	isOutside?: boolean;
	socialSecurityNumber: number;
	documentCount?: number;
	isEditable: boolean;
	absenceDetails?: [];
}

export interface AddAppointmentRequestData {
	doctorId?: number;
	userId: number;
	patientFname: string;
	patientLname: string;
	patientEmail: string;
	patientTel: number;
	comments: string;
	examDetails: Array<{
		examId: number;
		startedAt: string;
		endedAt: string;
		roomList?: number[];
		userList?: number[];
	}>;
	exams: Array<{
		examId: number;
		startedAt: string;
		endedAt: string;
		rooms?: any[];
		users?: number[];
	}>;
	approval?: AppointmentStatus;
	createdBy?: number;
	updatedBy?: number;
	rejectReason?: string;
	readStatus?: number;
	endedAt?: Date | null;
	id?: number;
	patientTimeZone?: string;
	socialSecurityNumber: number;
}

export interface AddOutSideOperatingHoursAppointmentRequest {
	doctorId?: number;
	patientFname: string;
	patientLname: string;
	patientEmail: string;
	patientTel: number;
	comments: string;
	examList: Array<any>;
	userList?: Array<any>;
	startedAt: any;
	userId: number;
	rejectReason: string;
	fromPatient: boolean;
	patientTimeZone?: string;
	id?: number;
	socialSecurityNumber: number;
}

export type ExtensionType = 'shorten' | 'extend';

export type ChangePosition = 'AtTheTop' | 'AtTheBottom';

export interface UpdateDurationRequestData {
	appointmentId: number;
	examId: number;
	amountofMinutes: number;
	from: ChangePosition;
	extensionType: ExtensionType;
}

//  Appointment SLots Models

export interface Slot {
	start: string;
	end: string;
	isCombined: boolean;
	exams: {
		start: string;
		end: string;
		examId: number;
		roomId?: number[];
		userId?: number[];
	}[];
}

export interface SlotModified {
	start: string;
	end: string;

	exams?: any[];
	examId: number;
	userList?: number[];
	roomList?: any[];
	slot: string;
}

export interface AppointmentSlot {
	title: string;
	start: string;
	end: string;
	workStatus: WorkStatusesEnum;
	workStatusText: WorkStatuses;
	isAvailable: boolean;
	isCombined: boolean;
	slots: Slot[];
}

export type WorkStatuses = 'Working' | 'Holiday' | 'Off' | 'Past';

export enum WorkStatusesEnum {
	Working = 1,
	Holiday,
	Off,
	Past,
}

export interface AppointmentSlotsRequestData {
	fromDate?: string;
	toDate?: string;
	date: string;
	exams: number[] | string[];
	AppointmentId: number;
}

export interface SelectedSlots {
	[key: number]: {
		slot: string;
		examId: number;
		exams?: any[];
		userList: number[];
		roomList: number[];
	};
}

export interface CreateAppointmentFormValues {
	patientFname: string;
	patientLname: string;
	patientEmail: string;
	patientTel: number;
	startedAt: any;
	startTime: string;
	doctorId: number;
	userId: number;
	examList: number[];
	comments: string;
	socialSecurityNumber: number;
	userList?: string[];
	qrCodeId: string;
}

export interface UpdateRadiologistRequestData {
	appointmentId: number;
	examId: number;
	userId: number[];
}
