export enum Status {
  Inactive,
  Active,
}

export const StatusToName: { [key: number]: StatusName } = {
  0: 'Inactive',
  1: 'Active',
};

export type StatusName = 'Active' | 'Inactive';

export enum AppointmentStatus {
  Pending,
  Approved,
  Cancelled,
}

export enum ReadStatus {
  Unread,
  Read,
}

export interface ChangeStatusRequestData {
  id: number;
  status: number;
}
