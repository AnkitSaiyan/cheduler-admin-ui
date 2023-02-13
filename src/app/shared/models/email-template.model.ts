export interface Email {
  id: number;
  name: string;
  title: string;
  subject: string;
  content: string;
  isActive: boolean;
  adminContent: string;
  status: 0;
}

export interface EmailTemplateRequestData {
  title: string;
  subject: string;
  isActive: boolean;
}
