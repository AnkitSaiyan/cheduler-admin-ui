export type Document = {
	id: number;
	apmtQRCodeId: string;
	appointmentId: number;
	azureBlobFileName: string;
	file: any;
	fileData: string;
	fileName: string;
	isUploadedFromQR: boolean;
	isImage?: boolean;
};
