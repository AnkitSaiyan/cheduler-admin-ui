import { Component, OnInit } from '@angular/core';
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { DestroyableComponent } from '../destroyable.component';
import { Subject, map, take, takeUntil } from 'rxjs';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { Translate } from '../../models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { ENG_BE } from '../../utils/const';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

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
		const downloadLink = document.createElement('a');
		downloadLink.href = this.downloadableDoc;
		downloadLink.download = this.fileName;
		downloadLink.click();
		this.isDownloadClick = false;
	}

	public closeModal() {
		this.activeModal.close();
	}
}
