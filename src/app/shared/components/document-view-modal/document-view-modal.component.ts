import { Component, OnInit } from '@angular/core';
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { Subject, take, takeUntil } from 'rxjs';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Translate } from '../../models/translate.model';
import { ENG_BE } from '../../utils/const';
import { DestroyableComponent } from '../destroyable.component';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
	selector: 'dfm-document-view-modal',
	templateUrl: './document-view-modal.component.html',
	styleUrls: ['./document-view-modal.component.scss'],
})
export class DocumentViewModalComponent extends DestroyableComponent implements OnInit {
	private readonly base64ImageStart = 'data:image/*;base64,';

	private readonly base64PdfStart = 'data:application/pdf;base64,';

	public image = new Subject<string>();

	private downloadableDoc!: string;

	public fileName!: string;

	public isImage: boolean = true;

	private isDownloadClick: boolean = false;

	private selectedLang: string = ENG_BE;

	constructor(
		private modalSvc: ModalService,
		private appointmentApiSvc: AppointmentApiService,
		private notificationService: NotificationDataService,
		private shareDataSvc: ShareDataService,
		private activeModal: NgbActiveModal,
		private sanitizer: DomSanitizer,
	) {
		super();
	}

	ngOnInit(): void {
		this.modalSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data) => {
			this.getDocument(data.id);
		});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => {
					this.selectedLang = lang;
				},
			});
	}

	public getDocument(id) {
		this.appointmentApiSvc
			.getDocumentById$(id, true)
			.pipe(takeUntil(this.destroy$$))
			.subscribe((res) => {
				this.isImage = !res.fileName.includes('.pdf');
				if (!this.downloadableDoc) this.image.next((this.isImage ? this.base64ImageStart : this.base64PdfStart) + res.fileData);
				this.fileName = res.fileName;
			});
		this.appointmentApiSvc
			.getDocumentById$(id, false)
			.pipe(take(1))
			.subscribe((res) => {
				this.image.next((!res.fileName.includes('.pdf') ? this.base64ImageStart : this.base64PdfStart) + res.fileData);
				this.downloadableDoc = (res.fileName.includes('.pdf') ? this.base64PdfStart : this.base64ImageStart) + res.fileData;
				this.fileName = res.fileName;
				if (this.isDownloadClick) this.downloadDocument();
			});
	}

	public downloadDocument() {
		if (!this.downloadableDoc) {
			this.isDownloadClick = true;
			this.notificationService.showNotification(Translate.DownloadingInProgress[this.selectedLang]);
			return;
		}

		this.downloadImage(this.downloadableDoc);
	}

	public closeModal() {
		this.activeModal.close();
	}

	private downloadImage(base64Data: string) {
		const blob = this.base64ToBlob(this.getSanitizeImage(base64Data));
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = this.fileName;
		a.target = '_self';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}

	private base64ToBlob(base64Data: string): Blob {
		const byteString = window.atob(base64Data.split(',')[1]);
		const mimeString = `${this.isImage ? 'image' : 'application'}/${this.fileName.split('.').slice(-1)}`;
		const arrayBuffer = new ArrayBuffer(byteString.length);
		const uint8Array = new Uint8Array(arrayBuffer);
		for (let i = 0; i < byteString.length; i++) {
			uint8Array[i] = byteString.charCodeAt(i);
		}
		return new Blob([arrayBuffer], { type: mimeString });
	}

	private getSanitizeImage(base64: string): any {
		let url1: any = this.sanitizer.bypassSecurityTrustResourceUrl(base64);
		return url1.changingThisBreaksApplicationSecurity;
	}
}
