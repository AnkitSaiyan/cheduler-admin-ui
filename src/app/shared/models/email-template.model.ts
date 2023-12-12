import { Status } from './status.model';

export interface Email {
	id: number;
	name: string;
	title: string;
	subject: string;
	content: string;
	adminContent: string;
	status: Status;
}

export type EmailTemplateRequestData = Omit<Email, 'name'>;
