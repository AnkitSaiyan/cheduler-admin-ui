import { AppointmentStatus, ReadStatus, Status } from '../models/status.model';
import { UserType } from '../models/user.model';

//  Status Enums

export function getStatusEnum(): typeof Status {
  return Status;
}

export function getAppointmentStatusEnum(): typeof AppointmentStatus {
  return AppointmentStatus;
}

export function getReadStatusEnum(): typeof ReadStatus {
  return ReadStatus;
}

// Type Enums

export function getUserTypeEnum(): typeof UserType {
  return UserType;
}
