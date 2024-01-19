import { Component, OnInit } from '@angular/core';
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { BehaviorSubject, Subject, map, race, take, takeUntil } from 'rxjs';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Translate } from '../../models/translate.model';
import { ENG_BE } from '../../utils/const';
import { DestroyableComponent } from '../destroyable.component';
import { DomSanitizer } from '@angular/platform-browser';
import { Document, docApiRes } from '../../models/document.model';

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

	public documents$$: BehaviorSubject<Document[]> = new BehaviorSubject<Document[]>([]);

	public focusedDocument!: Document;

	private modalData!: any;

	public isOriginFileLoading$$ = new BehaviorSubject<boolean>(false);

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
			this.modalData = data;
			if (data?.documentList) {
				this.showDocuments(data?.documentList, data?.focusedDocId);
			}
			this.getDocument(data.id, data?.focusedDocId);
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

	public getDocument(id, focusedDocId?: number) {
		if (!this.modalData?.documentList) {
			this.appointmentApiSvc
				.getDocumentById$(id, true)
				.pipe(take(1))
				.subscribe((res: any) => {
					if (!this.documents$$.value.length) this.showDocuments(res, focusedDocId);
				});
		}
		this.isOriginFileLoading$$.next(true);
		this.appointmentApiSvc
			.getDocumentById$(id, false)
			.pipe(take(1))
			.subscribe({
				next: (res: any) => {
					this.showDocuments(res, focusedDocId);
					this.isOriginFileLoading$$.next(false);
				},
				error: () => {
					this.isOriginFileLoading$$.next(false);
				},
			});
	}

	private showDocuments(documentRes: Document[], focusedDocId?: number) {
		this.documents$$.next(
			documentRes.map((res) => ({
				...res,
				fileData: (!res.fileName.includes('.pdf') ? this.base64ImageStart : this.base64PdfStart) + res.fileData,
				isImage: !res.fileName.includes('.pdf'),
			})),
		);
		if (this.focusedDocument) {
			this.focusedDocument = this.documents$$.value?.find(({ id }) => id === this.focusedDocument.id) ?? this.documents$$.value[0];
		} else {
			this.focusedDocument = this.documents$$.value?.find(({ id }) => id === focusedDocId) ?? this.documents$$.value[0];
		}
	}

	public setFocus(docData: Document) {
		this.focusedDocument = docData;
	}

	public downloadDocument() {
		if (!this.focusedDocument) {
			return;
		}
		this.notificationService.showNotification(Translate.DownloadingInProgress[this.selectedLang]);
		this.downloadImage(this.focusedDocument);
	}

	private downloadImage(docData: Document) {
		const blob = this.base64ToBlob(this.getSanitizeImage(docData.fileData), docData);
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = docData.fileName;
		a.target = '_self';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}

	private base64ToBlob(base64Data: string, docData: Document): Blob {
		const byteString = window.atob(base64Data.split(',')[1]);
		const mimeString = `${docData.isImage ? 'image' : 'application'}/${docData.fileName.split('.').slice(-1)}`;
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

	public closeModal() {
		this.activeModal.close();
	}
}
