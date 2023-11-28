export enum Status {
  Inactive,
  Active,
}

export const StatusToName: { [key: number]: StatusName } = {
  0: 'Inactive',
  1: 'Active',
  2: '—',
};

export type StatusName = 'Active' | 'Inactive' | '—';

export const AppointmentStatusToName: { [key: number]: AppointmentStatusName } = {
  0: 'Pending',
  1: 'Approved',
  2: 'Cancelled',
};

export type AppointmentStatusName = 'Pending' | 'Approved' | 'Cancelled';

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
  id: number | string;
  status: number;
}
