export interface SiteManagement {
  id: number;
  name: string;
  logo: any;
  disableAppointment: boolean;
  disableWarningText: string | null;
  introductoryText: string;
  doctorReferringConsent: 0 | 1;
  address: string;
  email: string;
  telephone: number;
  cancelAppointmentTime: number;
  file?: null | File;
  isSlotsCombinable: boolean;
  reminderTime: number;
  isAppointmentAutoconfirm: boolean;
}

export interface SiteManagementRequestData {
  name: string;
  disableAppointment: boolean;
  disableWarningText: string | null;
  introductoryText: string;
  doctorReferringConsent: 0 | 1;
  cancelAppointmentTime: number;
  address: string;
  email: string;
  telephone: number;
  file?: null | File | Blob;
  id?: number;
  isSlotsCombinable: boolean;
  reminderTime: number;
  isAppointmentAutoconfirm: boolean;
}
