export interface Notification {
    date: Date;
    message: string;
    subTitle: string;
    timeSpan: string;
    title: string;
    apmtId: number;
    patientAzureId?: string;
  }
