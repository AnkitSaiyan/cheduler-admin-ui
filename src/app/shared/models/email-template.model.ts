import { Status } from "./status.model";

export interface Email {
  id: number;
  name: string;
  title: string;
  subject: string;
  content: string;
  adminContent: string;
  status: Status;
}

export interface EmailTemplateRequestData {
  title: string;
  subject: string;
  status: Status;
  content: string;
  adminContent: string;
  id: number
}
