import { AppointmentStatus, ReadStatus, Status } from '../models/status.model';

export function getStatusEnum(): typeof Status {
  return Status;
}

export function getAppointmentStatusEnum(): typeof AppointmentStatus {
  return AppointmentStatus;
}

export function getReadStatusEnum(): typeof ReadStatus {
  return ReadStatus;
}
