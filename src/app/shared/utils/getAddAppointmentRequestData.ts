import { AddAppointmentRequestData, Appointment } from '../models/appointment.model';
import { Physician } from '../models/physician.model';
import { RoomType } from '../models/rooms.model';
import { AppointmentStatus, ReadStatus } from '../models/status';
import { User } from '../models/user.model';
import { Exam } from '../models/exam.model';

export function getAddAppointmentRequestData(appointment: Appointment, addID = true) {
  // return {
  //   ...(addID && appointment.id ? { id: appointment.id } : {}),
  //   patientFname: appointment.patientFname,
  //   patientLname: appointment.patientLname,
  //   patientTel: appointment.patientTel,
  //   patientEmail: appointment.patientEmail,
  //   startedAt: appointment.startedAt,
  //   endedAt: appointment.endedAt,
  //   userId: appointment.userId,
  //   readStatus: appointment.readStatus,
  //   doctorId: appointment.doctorId;
  //   doctor: appointment.doctor;
  //   examName?: string;
  //   roomType: RoomType;
  //   comments: string;
  //   approval: AppointmentStatus;
  //   rejectReason: string;
  //   readStatus: ReadStatus;
  //   startedAt: Date;
  //   endedAt: Date;
  //   createdBy?: number;
  //   updatedBy?: number;
  //   cancelTillTime?: string;
  //   user: User;
  //   userId: number;
  //   examList: number[];
  //   exams?: Exam[];
  // } as AddAppointmentRequestData;
}
