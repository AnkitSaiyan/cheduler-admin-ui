import { Physician } from './physician.model';
import { RoomType } from './rooms.model';
import { Exam } from './exam.model';
import { User } from './user.model';
import { AppointmentStatus, ReadStatus } from './status';

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
}

export interface AddAppointmentRequestData {
  doctorId: number;
  userId: number;
  patientFname: string;
  patientLname: string;
  patientEmail: string;
  patientTel: number;
  roomType: RoomType;
  comments: string;
  startedAt: Date;
  examList: number[];
  approval?: AppointmentStatus;
  createdBy?: number;
  updatedBy?: number;
  rejectReason?: string;
  readStatus?: number;
  endedAt?: Date | null;
  id?: number;
}

export type ExtensionType = 'shorten' | 'prelong';

export type ChangePosition = 'AtTheTop' | 'AtTheBottom';

export interface UpdateDurationRequestData {
  id: number;
  amountofMinutes: number;
  from: ChangePosition;
  extensionType: ExtensionType;
}
