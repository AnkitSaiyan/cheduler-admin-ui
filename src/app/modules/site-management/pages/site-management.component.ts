import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SiteManagement, SiteManagementRequestData } from '../../../shared/models/site-management.model';
import { TimeDurationType } from '../../../shared/models/calendar.model';
import { NotificationDataService } from '../../../core/services/notification-data.service';
import { SiteManagementApiService } from '../../../core/services/site-management-api.service';
import { DestroyableComponent } from '../../../shared/components/destroyable.component';
import { EMAIL_REGEX } from '../../../shared/utils/const';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../shared/utils/const';
import { Translate } from '../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';

interface FormValues {
	name: string;
	introductoryText: string;
	disableAppointment: boolean;
	disableWarningText: string | null;
	heading: string;
	subHeading: string;
	bodyText: string;
	headingEnglish: string;
	subHeadingEnglish: string;
	bodyTextEnglish: string;
	doctorReferringConsent: 0 | 1;
	isAppointmentAutoconfirm: boolean;
	cancelAppointmentTime: number;
	cancelAppointmentType: TimeDurationType;
	address: string;
	email: string;
	telephone: number;
	file: { file: ArrayBuffer | string | SafeResourceUrl; loading: boolean; fileBlob: Blob };
	isSlotsCombinable: boolean;
	reminderTime: number;
	reminderTimeType: TimeDurationType;
	isAppointmentAutoconfirmAdmin: boolean;
	documentSize: number;
	editUploadedDocument: boolean;
}

@Component({
	selector: 'dfm-site-management',
	templateUrl: './site-management.component.html',
	styleUrls: ['./site-management.component.scss'],
})
export class SiteManagementComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public siteManagementForm!: FormGroup;

	public siteManagementData$$ = new BehaviorSubject<SiteManagement | undefined>(undefined);

	public submitting$$ = new BehaviorSubject<boolean>(false);

	public timeDurations: any[] = [];

	private selectedLang: string = ENG_BE;

	public documentSize: any[] = [];

	constructor(
		private fb: FormBuilder,
		private notificationSvc: NotificationDataService,
		private siteManagementApiSvc: SiteManagementApiService,
		private cdr: ChangeDetectorRef,
		private sanitizer: DomSanitizer,
		private shareDataSvc: ShareDataService,
	) {
		super();
	}

	public ngOnInit(): void {
		for (let i = 1; i < 11; i++) this.documentSize.push({ name: i + ' MB', value: i });

		this.siteManagementApiSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.timeDurations = items));

		this.siteManagementApiSvc.siteManagementData$.pipe(takeUntil(this.destroy$$)).subscribe((siteManagementData) => {
			this.createForm(siteManagementData);
			this.siteManagementData$$.next(siteManagementData ?? {});
		});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => {
				this.selectedLang = lang;
			});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public get formValues(): FormValues {
		return this.siteManagementForm.value;
	}

	private createForm(siteManagementData?: SiteManagement | undefined): void {
		let duration = 0;
		let reminderDuration = 0;
		let durationType: TimeDurationType = 'Minutes';
		let reminderDurationTYpe: TimeDurationType = 'Minutes';
		let introductoryTextObj;
		let introductoryTextObjEnglish;

		const file: {
			loading: boolean;
			fileBlob: Blob | null;
			file: string | ArrayBuffer | SafeResourceUrl | null;
		} = {
			loading: false,
			file: null,
			fileBlob: null,
		};

		if (siteManagementData) {
			if (siteManagementData.cancelAppointmentTime) {
				duration = siteManagementData.cancelAppointmentTime;
				if (duration >= 1440 && duration % 1440 === 0) {
					duration /= 1440;
					durationType = 'Days';
				} else if (duration >= 60 && duration % 60 === 0) {
					duration /= 60;
					durationType = 'Hours';
				}
			}

			if (siteManagementData.reminderTime) {
				reminderDuration = siteManagementData.reminderTime;
				if (reminderDuration >= 1440 && reminderDuration % 1440 === 0) {
					reminderDuration /= 1440;
					reminderDurationTYpe = 'Days';
				} else if (reminderDuration >= 60 && reminderDuration % 60 === 0) {
					reminderDuration /= 60;
					reminderDurationTYpe = 'Hours';
				}
			}

			if (siteManagementData.introductoryText) {
				try {
					introductoryTextObj = JSON.parse(siteManagementData.introductoryText);
					introductoryTextObjEnglish = JSON.parse(siteManagementData.introductoryTextEnglish);
				} catch (e) {}
			}

			if (siteManagementData?.logo) {
				file.file = this.sanitizer.bypassSecurityTrustResourceUrl(`data:image/png;base64, ${siteManagementData?.logo}`);

				fetch(`data:image/png;base64, ${siteManagementData?.logo}`)
					.then((res) => res.blob())
					.then((res) => (file.fileBlob = res));
			}
		}

		this.siteManagementForm = this.fb.group({
			name: [siteManagementData?.name ?? '', [Validators.required]],
			file: [{ ...file }, []],
			introductoryText: [siteManagementData?.introductoryText ?? null, []],
			heading: [introductoryTextObj?.heading ?? '', []],
			subHeading: [introductoryTextObj?.subHeading ?? '', []],
			bodyText: [introductoryTextObj?.bodyText ?? '', []],
			headingEnglish: [introductoryTextObjEnglish?.headingEnglish ?? '', []],
			subHeadingEnglish: [introductoryTextObjEnglish?.subHeadingEnglish ?? '', []],
			bodyTextEnglish: [introductoryTextObjEnglish?.bodyTextEnglish ?? '', []],
			disableAppointment: [!!siteManagementData?.disableAppointment, []],
			disableWarningText: [siteManagementData?.disableWarningText ?? '', []],
			doctorReferringConsent: [siteManagementData?.doctorReferringConsent, []],
			cancelAppointmentTime: [duration, []],
			cancelAppointmentType: [durationType, []],
			email: [siteManagementData?.email ?? '', [Validators.required]],
			telephone: [siteManagementData?.telephone, [Validators.required]],
			address: [siteManagementData?.address, [Validators.required]],
			isSlotsCombinable: [!!siteManagementData?.isSlotsCombinable, [Validators.required]],
			reminderTime: [reminderDuration, []],
			reminderTimeType: [reminderDurationTYpe, []],
			isAppointmentAutoconfirm: [!!siteManagementData?.isAppointmentAutoconfirm, [Validators.required]],
			isAppointmentAutoconfirmAdmin: [!!siteManagementData?.isAppointmentAutoconfirmAdmin, [Validators.required]],
			documentSize: [5, [Validators.required]],
			editUploadedDocument: [!!siteManagementData?.editUploadedDocument, [Validators.required]],
		});

		setTimeout(() => {
			this.siteManagementForm.patchValue({
				reminderTimeType: reminderDurationTYpe,
				cancelAppointmentType: durationType,
				documentSize: siteManagementData?.documentSizeInKb ? siteManagementData?.documentSizeInKb / 1024 : 5,
			});
		}, 0);

		this.cdr.detectChanges();
	}

	public saveSiteManagementData(): void {
		if (this.siteManagementForm.invalid) {
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			Object.keys(this.siteManagementForm.controls).forEach((key) => {
				if (this.siteManagementForm.get(key)?.invalid) {
					this.siteManagementForm.get(key)?.markAsTouched();
				}
			});
			return;
		}

		if (this.formValues.disableAppointment && !this.formValues.disableWarningText) {
			this.notificationSvc.showNotification('Please add disable warning text', NotificationType.WARNING);
			return;
		}

		this.submitting$$.next(true);

		const {
			heading,
			subHeading,
			bodyText,
			headingEnglish,
			subHeadingEnglish,
			bodyTextEnglish,
			file,
			cancelAppointmentType,
			reminderTimeType,
			...rest
		} = this.formValues;

		const requestData: SiteManagementRequestData = {
			...rest,
			file: file.fileBlob,
			disableWarningText: rest.disableAppointment ? rest.disableWarningText : null,
			cancelAppointmentTime: (function () {
				switch (cancelAppointmentType) {
					case 'Hours':
						return rest.cancelAppointmentTime * 60;
					case 'Days':
						return rest.cancelAppointmentTime * 1440;
					default:
						return rest.cancelAppointmentTime;
				}
			})(),
			reminderTime: (function () {
				switch (reminderTimeType) {
					case 'Hours':
						return rest.reminderTime * 60;
					case 'Days':
						return rest.reminderTime * 1440;
					default:
						return rest.reminderTime;
				}
			})(),
			introductoryTextEnglish: '',
		};

		requestData.introductoryText = JSON.stringify({
			heading,
			subHeading,
			bodyText,
		});
		requestData.introductoryTextEnglish = JSON.stringify({
			headingEnglish,
			subHeadingEnglish,
			bodyTextEnglish,
		});

		if (this.siteManagementData$$.value && this.siteManagementData$$.value?.id) {
			requestData.id = this.siteManagementData$$.value.id;
		}

		this.siteManagementApiSvc
			.saveSiteManagementData$(requestData)
			.pipe(takeUntil(this.destroy$$))
			.subscribe(
				() => {
					this.submitting$$.next(false);
					if (this.siteManagementData$$.value?.id) {
						this.notificationSvc.showNotification(Translate.SuccessMessage.SiteUpdated[this.selectedLang]);
					} else {
						this.notificationSvc.showNotification(Translate.SuccessMessage.SiteAdded[this.selectedLang]);
					}
				},
				(err) => {
					this.submitting$$.next(false);
					// this.notificationSvc.showNotification(Translate.Error.SomethingWrong[this.selectedLang], NotificationType.DANGER);
				},
			);
	}

	public onFileChange(event: Event) {
		const { files } = event.target as HTMLInputElement;

		if (files && files?.length) {
			const fileControl = this.siteManagementForm.get('file');

			fileControl?.setValue({
				file: null,
				loading: true,
			});

			const reader = new FileReader();

			reader.onload = (e: any) => {
				fileControl?.setValue({
					file: reader.result,
					fileBlob: files[0],
					loading: false,
				});
			};

			reader.readAsDataURL(files[0]);
		}
	}

	public removeFile() {
		this.siteManagementForm.get('file')?.setValue({
			...this.formValues.file,
			file: null,
			fileBlob: null,
		});
	}

	public handleEmailInput(e: Event): void {
		const inputText = (e.target as HTMLInputElement).value;

		if (!inputText) {
			return;
		}

		if (!inputText.match(EMAIL_REGEX)) {
			this.siteManagementForm.get('email')?.setErrors({
				email: true,
			});
		} else {
			this.siteManagementForm.get('email')?.setErrors(null);
		}
	}
}
