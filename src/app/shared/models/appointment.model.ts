import { Physician } from './physician.model';
import { RoomType } from './rooms.model';
import { Exam } from './exam.model';
import { User } from './user.model';
import { AppointmentStatus, ReadStatus } from './status';

export interface Appointment {
  id: number;
  doctorId: number;
  doctor: Physician;
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
  createdBy?: number;
  updatedBy?: number;
  cancelTillTime?: string;
  user: User;
  userId: number;
  examList: number[];
  exams?: Exam[];
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
