import { PartialBy, Prettify } from '../utils/types';

export interface SiteManagement {
	id: number;
	name: string;
	logo: any;
	disableAppointment: boolean;
	disableWarningText: string | null;
	introductoryText: string;
	introductoryTextEnglish: string;
	doctorReferringConsent: 0 | 1;
	cancelAppointmentTime: number;
	address: string;
	email: string;
	telephone: number;
	file?: null | File | Blob;
	isSlotsCombinable: boolean;
	reminderTime: number;
	isAppointmentAutoconfirm: boolean;
	isAppointmentAutoconfirmAdmin: boolean;
	editUploadedDocument: boolean;
	documentSizeInKb: number;
}

export type SiteManagementRequestData = Prettify<PartialBy<Omit<SiteManagement, 'logo' | 'documentSizeInKb'>, 'id'> & { documentSize: number }>;
