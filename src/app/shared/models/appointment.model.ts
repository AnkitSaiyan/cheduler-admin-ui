import { RoomType } from './rooms.model';
import { Exam } from './exam.model';
import { User } from './user.model';
import { AppointmentStatus, ReadStatus } from './status.model';

export interface Appointment {
  id: number;
  createdAt: Date;
  updatedAt: Date | null;
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
  exams: Exam[];
  apmtId: number;
  isCombineExam: boolean;
}

export interface AddAppointmentRequestData {
  doctorId: number;
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
  }>;
  approval?: AppointmentStatus;
  createdBy?: number;
  updatedBy?: number;
  rejectReason?: string;
  readStatus?: number;
  endedAt?: Date | null;
  id?: number;
}

export type ExtensionType = 'shorten' | 'extend';

export type ChangePosition = 'AtTheTop' | 'AtTheBottom';

export interface UpdateDurationRequestData {
  id: number;
  amountofMinutes: number;
  from: ChangePosition;
  extensionType: ExtensionType;
}

//  Appointment SLots Models

export interface Slot {
  start: string;
  end: string;
  examId: number;
}

export interface AppointmentSlot {
  title: string;
  start: string;
  end: string;
  workStatus: WorkStatusesEnum;
  workStatusText: WorkStatuses;
  isAvailable: boolean;
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
  fromDate: string;
  toDate: string;
  exams: number[];
}
