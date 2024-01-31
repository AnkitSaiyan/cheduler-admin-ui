import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest, debounceTime, filter, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import { NgbActiveModal, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { getDurationMinutes } from 'src/app/shared/models/calendar.model';
import { DatePipe } from '@angular/common';
import { DocumentViewModalComponent } from 'src/app/shared/components/document-view-modal/document-view-modal.component';
import { ModalService } from '../../../../core/services/modal.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ShareDataService } from '../../../../core/services/share-data.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import {
	AddAppointmentRequestData,
	AddOutSideOperatingHoursAppointmentRequest,
	Appointment,
	CreateAppointmentFormValues,
	SelectedSlots,
	Slot,
	SlotModified,
} from '../../../../shared/models/appointment.model';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { AppointmentUtils } from '../../../../shared/utils/appointment.utils';
import { SiteManagementApiService } from '../../../../core/services/site-management-api.service';
import { EMAIL_REGEX, ENG_BE } from '../../../../shared/utils/const';
import { GeneralUtils } from '../../../../shared/utils/general.utils';
import { Translate } from '../../../../shared/models/translate.model';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { CustomDateParserFormatter } from '../../../../shared/utils/dateFormat';
import { UserApiService } from '../../../../core/services/user-api.service';
import { Document } from 'src/app/shared/models/document.model';

@Component({
	selector: 'dfm-add-appointment-modal',
	templateUrl: './add-appointment-modal.component.html',
	styleUrls: ['./add-appointment-modal.component.scss'],
	providers: [{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }],
})
export class AddAppointmentModalComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public appointmentForm!: FormGroup;

	public submitting$$ = new BehaviorSubject(false);

	public loadingSlots$$ = new BehaviorSubject(false);

	public loading$$ = new BehaviorSubject<boolean>(false);

	public filteredExamList: NameValue[] = [];

	public filteredPhysicianList: NameValue[] = [];

	public filteredUserList: NameValue[] = [];

	public slots: SlotModified[] = [];

	public selectedTimeSlot: SelectedSlots = {};

	public examIdToAppointmentSlots: { [key: number]: SlotModified[] } = {};

	public examIdToDetails: { [key: number]: { name: string; expensive: number } } = {};

	public selectedTimeInUTC!: string;

	public selectedTimeInUTCOrig!: string;

	public isCombinable: boolean = false;

	public currentDate = new Date();

	public isDoctorConsentDisable$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	public dateControl = new FormControl();

	private examList: NameValue[] = [];

	private physicianList: NameValue[] = [];

	private userList: NameValue[] = [];

	public documentList$$ = new BehaviorSubject<Document[]>([]);

	public documentListError$$: BehaviorSubject<{ fileName: string; error: 'fileFormat' | 'fileLimit' }[]> = new BehaviorSubject<
		{ fileName: string; error: 'fileFormat' | 'fileLimit' }[]
	>([]);

	public isDocumentUploading$$ = new BehaviorSubject<boolean>(false);

	public modalData!: {
		event: MouseEvent;
		element: HTMLDivElement;
		elementContainer: HTMLDivElement;
		startedAt: Date;
		startTime?: string;
		limit?: { min: string; max: string; grayOutMin: string; grayOutMax: string };
		isOutside: boolean;
		appointment?: Appointment;
	};

	private pixelPerMinute = 4;

	private selectedLang = ENG_BE;

	public isOutside: boolean = false;

	private staffs: NameValue[] = [];

	public filteredStaffs: NameValue[] = [];

	public uploadFileName!: string;

	public fileSize!: number;

	public fileMaxCount!: number;

	public documentStage: string = '';

	public edit: boolean = false;

	constructor(
		private modalSvc: ModalService,
		private fb: FormBuilder,
		private shareDataSvc: ShareDataService,
		private examApiService: ExamApiService,
		private nameValuePipe: NameValuePairPipe,
		private appointmentApiSvc: AppointmentApiService,
		private physicianApiSvc: PhysicianApiService,
		private userApiService: UserApiService,
		private notificationSvc: NotificationDataService,
		private siteManagementApiSvc: SiteManagementApiService,
		private datePipe: DatePipe,
		private activeModal: NgbActiveModal,
	) {
		super();
	}

	public get formValues(): CreateAppointmentFormValues {
		return this.appointmentForm?.value;
	}

	public ngOnInit(): void {
		this.siteManagementApiSvc.siteManagementData$.pipe(take(1)).subscribe((siteSettings) => {
			this.isCombinable = siteSettings.isSlotsCombinable;
			this.fileSize = siteSettings.documentSizeInKb / 1024;
			this.isDoctorConsentDisable$$.next(siteSettings.doctorReferringConsent === 1);
			this.fileMaxCount = siteSettings.docUploadMaxCount;
		});

		this.modalSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data) => {
			this.modalData = data;

			this.isOutside = this.modalData.isOutside;
			if (this.modalData?.event?.offsetY) {
				let minutes = Math.round(+this.modalData.event.offsetY / this.pixelPerMinute);
				if (this.modalData?.limit) {
					minutes += getDurationMinutes(DateTimeUtils.timeStingToDate('00:00:00'), DateTimeUtils.timeStingToDate(this.modalData.limit.min));
				}

				// In case if calendar start time is not 00:00 then adding extra minutes
				if (this.modalData?.startTime) {
					const startTime = this.modalData.startTime.split(':');
					minutes += DateTimeUtils.DurationInMinFromHour(+startTime[0], +startTime[1]);
				}

				const roundedMin = minutes - (minutes % 5);

				const hour = `0${Math.floor(minutes / 60)}`.slice(-2);
				const min = `0${roundedMin % 60}`.slice(-2);
				this.selectedTimeInUTCOrig = `${hour}:${min}:00`;
				this.selectedTimeInUTC = this.selectedTimeInUTCOrig;
			} else if (this.modalData?.appointment?.startedAt) {
				const date = new Date(this.modalData?.appointment?.startedAt);
				const time = this.datePipe.transform(date, 'hh:mm');
				this.selectedTimeInUTCOrig = `${time}:00`;
				this.selectedTimeInUTC = this.selectedTimeInUTCOrig;
			}
		});

		this.createForm();

		if (this.modalData.appointment?.id) {
			this.loading$$.next(true);
			this.edit = true;
			this.appointmentApiSvc
				.getAppointmentByID$(this.modalData.appointment.id)
				.pipe(take(1))
				.subscribe({
					next: (appointment) => this.updateForm(appointment as Appointment),
					error: ()=> this.loading$$.next(false),
				});
			if (this.modalData.appointment?.id && this.modalData.appointment.documentCount) this.getDocument(this.modalData.appointment.id);
		}

		this.setupSubscriptions()

	}

	private setupSubscriptions() {
		combineLatest([this.appointmentForm.get('examList')?.valueChanges.pipe(filter((examList) => !!examList?.length)) ?? []])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe();

		this.appointmentForm
			.get('startedAt')
			?.valueChanges.pipe(takeUntil(this.destroy$$))
			.subscribe((selectedDate) => {
				const newDate = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
				this.shareDataSvc.setDate(newDate);
			});

		this.examApiService.allExams$.pipe(takeUntil(this.destroy$$)).subscribe((exams) => {
			const keyValueExams = this.nameValuePipe.transform(exams, 'name', 'id');
			this.filteredExamList = [...keyValueExams];
			this.examList = [...keyValueExams];

			exams?.forEach((exam) => {
				if (!this.examIdToDetails[+exam.id]) {
					this.examIdToDetails[+exam.id] = {
						name: exam.name,
						expensive: exam.expensive,
					};
				}
			});
		});

		this.physicianApiSvc.allPhysicians$.pipe(takeUntil(this.destroy$$)).subscribe((physicians) => {
			const keyValuePhysicians = this.nameValuePipe.transform(physicians, 'fullName', 'id');
			this.filteredPhysicianList = [...keyValuePhysicians];
			this.physicianList = [...keyValuePhysicians];
		});

		this.appointmentForm
			.get('startedAt')
			?.valueChanges.pipe(
				debounceTime(0),
				filter((startedAt) => startedAt?.day && this.formValues.examList?.length),
				tap(() => this.loadingSlots$$.next(true)),
				map((date) => {
					this.clearSlotDetails();
					return AppointmentUtils.GenerateSlotRequestData(date, this.formValues.examList);
				}),
				switchMap((reqData) => this.appointmentApiSvc.getSlots$({ ...reqData, AppointmentId: this.modalData?.appointment?.id ?? 0 })),
			)
			.subscribe((slots) => {
				this.setSlots(slots[0].slots, slots[0]?.isCombined);
				this.loadingSlots$$.next(false);
			});

		const examListSubscription = this.appointmentForm
			.get('examList')
			?.valueChanges.pipe(
				debounceTime(0),
				tap(() => this.updateEventCard()),
				filter((examList) => examList?.length && this.formValues.startedAt?.day),
				tap(() => this.loadingSlots$$.next(true)),
				map((examList) => {
					this.clearSlotDetails();
					return AppointmentUtils.GenerateSlotRequestData(this.formValues.startedAt, examList);
				}),
				switchMap((reqData) => this.appointmentApiSvc.getSlots$({ ...reqData, AppointmentId: this.modalData?.appointment?.id ?? 0 })),
			)
			.subscribe((data) => {
				const { slots }: any = data[0];

				const matchedSlot = slots?.find((slotData) => slotData.start === this.selectedTimeInUTC);
				// Show selected slot in case of one exam or if the case is combinable
				if (matchedSlot && (this.formValues.examList.length === 1 || this.isCombinable)) {
					this.setSlots([matchedSlot], this.isCombinable);
					this.slots.forEach((value) => {
						this.handleSlotSelectionToggle(value);
					});
				} else {
					this.setSlots(slots, this.isCombinable);
				}
				this.setSlots(slots, this.isCombinable);
				this.loadingSlots$$.next(false);
			});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => (this.selectedLang = lang));

		this.userApiService.allStaffs$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (staffs) => {
				const keyValueExams = this.nameValuePipe.transform(staffs, 'fullName', 'id');
				this.staffs = [...keyValueExams];
				this.filteredUserList = [...keyValueExams];
				this.userList = [...keyValueExams];
				this.filteredStaffs = [...this.staffs];
			},
		});

		if (this.isOutside) {
			this.appointmentForm.addControl('userList', new FormControl([]));
			examListSubscription?.unsubscribe();
		}
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public close(result: boolean) {
		this.activeModal.close(result);
	}

	public checkSlotAvailability(slot: SlotModified) {
		return AppointmentUtils.IsSlotAvailable(slot, this.selectedTimeSlot);
	}

	public handleSlotSelectionToggle(slots: SlotModified) {
		AppointmentUtils.ToggleSlotSelection(slots, this.selectedTimeSlot);
		let smallestStartTime = '';
		Object.values(this.selectedTimeSlot).forEach((slot) => {
			if (!smallestStartTime || DateTimeUtils.TimeToNumber(slot.start) < DateTimeUtils.TimeToNumber(smallestStartTime)) {
				smallestStartTime = slot.start;
			}
		});
		this.selectedTimeInUTC = smallestStartTime;
	}

	public saveAppointment(): void {
		if (this.appointmentForm.invalid) {
			this.notificationSvc.showNotification(`${Translate.FormInvalid[this.selectedLang]}!`, NotificationType.WARNING);
			this.appointmentForm.markAllAsTouched();
			return;
		}

		if (
			(this.isCombinable && !Object.values(this.selectedTimeSlot).length) ||
			Object.values(this.selectedTimeSlot).some((slot) => !slot.start) ||
			(!this.isCombinable && Object.values(this.selectedTimeSlot).length !== this.formValues.examList?.length) ||
			Object.values(this.selectedTimeSlot).some((slot) => !slot.start)
		) {
			this.notificationSvc.showNotification(`${Translate.SelectSlots[this.selectedLang]}.`, NotificationType.WARNING);
			return;
		}

		this.submitting$$.next(true);

		if (this.isCombinable) {
			this.formValues.examList.forEach((examID) => {
				const selectedSlot = Object.values(this.selectedTimeSlot)[0];

				if (!this.selectedTimeSlot[+examID]) {
					this.selectedTimeSlot[+examID] = {
						...selectedSlot,
						examId: +examID,
					};
				}
			});
		}

		const requestData: AddAppointmentRequestData = AppointmentUtils.GenerateAppointmentRequestData(
			{ ...this.formValues },
			{ ...this.selectedTimeSlot },
			{} as Appointment,
			this.isCombinable,
		);

		if (this.isDoctorConsentDisable$$.value) {
			delete requestData.doctorId;
		}

		let observable: Observable<Appointment>;
		if (this.modalData?.appointment?.id) {
			observable = this.appointmentApiSvc.updateAppointment$({ ...requestData, id: this.modalData.appointment.id });
		} else {
			observable = this.appointmentApiSvc.saveAppointment$(requestData);
		}

		observable.pipe(takeUntil(this.destroy$$)).subscribe({
			next: () => {
				this.notificationSvc.showNotification(
					this.modalData.appointment?.id
						? `${Translate.SuccessMessage.AppointmentUpdate[this.selectedLang]}!`
						: `${Translate.SuccessMessage.AppointmentAdded[this.selectedLang]}!`,
				);
				this.submitting$$.next(false);
				this.close(true);
			},
			error: () => {
				this.submitting$$.next(false);
			},
		});
	}

	public saveOutSideOperatingHoursAppointment() {
		if (this.appointmentForm.invalid) {
			this.notificationSvc.showNotification(`${Translate.FormInvalid[this.selectedLang]}!`, NotificationType.WARNING);
			this.appointmentForm.markAllAsTouched();
			return;
		}
		this.submitting$$.next(true);

		const { startedAt, userList, ...rest } = this.formValues;
		const requestData: AddOutSideOperatingHoursAppointmentRequest = {
			...rest,
			startedAt: `${startedAt.year}-${String(startedAt.month).padStart(2, '0')}-${String(startedAt.day).padStart(2, '0')} ${this.selectedTimeInUTC}`,
			rejectReason: '',
			fromPatient: false,
			userList: userList?.length ? userList : [],
		};

		let observable: Observable<Appointment>;
		if (this.modalData?.appointment?.id) {
			observable = this.appointmentApiSvc.saveOutSideOperatingHoursAppointment$({ ...requestData, id: this.modalData.appointment.id }, 'update');
		} else {
			observable = this.appointmentApiSvc.saveOutSideOperatingHoursAppointment$(requestData, 'add');
		}

		observable.pipe(takeUntil(this.destroy$$)).subscribe({
			next: () => {
				this.notificationSvc.showNotification(`${Translate.SuccessMessage.AppointmentAdded[this.selectedLang]}!`);
				this.submitting$$.next(false);
				this.close(true);
			},
			error: () => {
				this.submitting$$.next(false);
			},
		});
	}

	public clearSlotDetails() {
		this.examIdToAppointmentSlots = {};
		this.selectedTimeSlot = {};
		this.slots = [];
	}

	public handleEmailInput(e: Event): void {
		const inputText = (e.target as HTMLInputElement).value;

		if (!inputText) {
			return;
		}

		if (!EMAIL_REGEX.exec(inputText)) {
			this.appointmentForm.get('patientEmail')?.setErrors({
				email: true,
			});
		} else {
			this.appointmentForm.get('patientEmail')?.setErrors(null);
		}
	}

	public handleDropdownSearch(searchText: string, type: 'user' | 'doctor' | 'exam' | 'staff'): void {
		switch (type) {
			case 'doctor':
				this.filteredPhysicianList = [...GeneralUtils.FilterArray(this.physicianList, searchText, 'name')];
				break;
			case 'user':
				this.filteredUserList = [...GeneralUtils.FilterArray(this.userList, searchText, 'name')];
				break;
			case 'exam':
				this.filteredExamList = [...GeneralUtils.FilterArray(this.examList, searchText, 'name')];
				break;
			case 'staff':
				this.filteredStaffs = [...GeneralUtils.FilterArray(this.staffs, searchText, 'name')];
				break;
			default:
				break;
		}
	}

	@HostListener('document:keyup.esc')
	private onKeyup() {
		if (this.modalData?.element) {
			this.modalData.element.remove();
		}
	}



	private createForm() {
		this.appointmentForm = this.fb.group({
			patientFname: [null, [Validators.required]],
			patientLname: [null, [Validators.required]],
			patientTel: [null, [Validators.required]],
			patientEmail: [null, []],
			doctorId: [null, []],
			startedAt: [null, [Validators.required]],
			examList: [[], [Validators.required]],
			userId: [null, [Validators.required]],
			comments: [null, []],
			socialSecurityNumber: [null, []],
			qrCodeId: ['', []],
		});

		if (this.modalData?.startedAt) {
			const date = new Date(this.modalData.startedAt);
			const startedAt = {
				year: date.getFullYear(),
				month: date.getMonth() + 1,
				day: date.getDate(),
			};
			this.appointmentForm.patchValue({ startedAt }, { emitEvent: true });
			this.dateControl.setValue(date);
		}
	}

	private updateForm(appointment: Appointment) {
		if (this.isOutside) this.appointmentForm.addControl('userList', new FormControl([]));
		appointment?.exams?.sort((exam1, exam2) => {
			if (exam1.startedAt < exam2.startedAt) {
				return -1;
			}
			return 1;
		});
		this.updateFormValues(appointment);
	}

	private updateFormValues(appointment: Appointment) {
		setTimeout(() => {
			this.appointmentForm.patchValue(
				{
					patientFname: appointment?.patientFname ?? null,
					patientLname: appointment?.patientLname ?? null,
					patientTel: appointment?.patientTel ?? null,
					patientEmail: appointment?.patientEmail ?? null,
					doctorId: appointment?.doctorId?.toString() ?? null,
					examList: appointment?.exams?.map((exam) => exam.id?.toString()) ?? [],
					comments: appointment?.comments ?? null,
					socialSecurityNumber: appointment?.socialSecurityNumber ?? null,
				},
				{ emitEvent: false },
			);
			this.appointmentForm.get('userList')?.setValue(appointment?.usersDetail.map((user) => user.id?.toString() ?? []));

			if (!appointment?.exams?.length) {
				this.appointmentForm.get('examList')?.markAsUntouched();
			}

			if (appointment?.patientAzureId) {
				['patientFname', 'patientLname', 'patientTel', 'patientEmail'].forEach((key) => {
					this.appointmentForm.get(key)?.disable();
				});
			}

			this.loading$$.next(false);
		}, 700);
	}

	private setSlots(slots: Slot[], isCombinable: boolean) {
		const { examIdToSlots, newSlots } = AppointmentUtils.GetModifiedSlotData(slots, isCombinable);

		this.examIdToAppointmentSlots = examIdToSlots;
		this.slots = newSlots;
	}

	private updateEventCard(slot?: Slot) {
		const { element } = this.modalData;
		if (!element) return;
		let totalExpense = 0;

		this.formValues.examList.forEach((examID) => {
			const expensive = +this.examIdToDetails[+examID].expensive;

			if (!isNaN(+expensive)) {
				totalExpense += +expensive;
			}
		});

		if (!this.formValues.examList?.length) {
			totalExpense = 5;
		}

		if (slot) {
			const hour = +slot.start.slice(0, 2);
			const min = +slot.start.slice(3, 5);
			const height = (hour * 60 + min) * this.pixelPerMinute;

			element.style.top = `${height}px`;

			setTimeout(() => this.scrollIntoView(), 0);
		}

		element.style.height = `${totalExpense * this.pixelPerMinute}px`;
	}

	private scrollIntoView() {
		if (!this.modalData?.element) return;
		this.modalData.element.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
	}

	public onDateChange(value: string, controlName: string) {
		this.appointmentForm.get(controlName)?.setValue(DateTimeUtils.DateToDateDistributed(new Date(value)));
	}

	public uploadRefferingNote(event: any): void {
		if (!event.target.files.length) {
			return;
		}

		this.fileChange(event);
	}

	private checkFileExtensions(file: any): boolean {
		const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
		const fileName = file.name;
		const fileExtension = fileName.split('.').pop().toLowerCase();
		if (!allowedExtensions.includes(fileExtension)) {
			return true;
		}
		return false;
	}

	private fileChange(event: any) {
		const e = event;
		const { files } = event.target as HTMLInputElement;

		if (files?.length) {
			const promises = Array.from(files).map((file) => this.readFileAsDataURL(file));
			Promise.all(promises).then((transformedDataArray) => {
				this.uploadDocuments(transformedDataArray);
				e.target.value = ''; // Clear the file input
			});
		}
	}

	private readFileAsDataURL(file: File): Promise<any> {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => {
				resolve(file);
			};
			reader.readAsDataURL(file);
		});
	}

	private async uploadDocuments(files: string[]) {
		const transformedDataArray = files;
		let isLimitExceeded = false;
		if (this.fileMaxCount === this.documentList$$.value?.length) {
			this.notificationSvc.showNotification(Translate.Error.UploadLimitExceeded[this.selectedLang], NotificationType.DANGER);
			return;
		}

		if (this.fileMaxCount < this.documentList$$.value?.length + transformedDataArray?.length) {
			transformedDataArray?.splice(this.fileMaxCount - this.documentList$$.value?.length);
			isLimitExceeded = true;
		}
		this.isDocumentUploading$$.next(true);
		const allPromise: any[] = [];
		for (const file of transformedDataArray) {
			if (!this.formValues.qrCodeId) {
				await this.uploadDocument(file);
			} else {
				allPromise.push(this.uploadDocument(file, this.formValues.qrCodeId));
			}
		}
		await Promise.all(allPromise);
		this.appointmentApiSvc
			.getDocumentById$(this.formValues.qrCodeId, true)
			.pipe(take(1))
			.subscribe({
				next: (documentList) => {
					this.documentList$$.next(documentList);
					this.isDocumentUploading$$.next(false);
					if (isLimitExceeded) {
						this.notificationSvc.showNotification(Translate.Error.UploadLimitExceeded[this.selectedLang], NotificationType.DANGER);
					}
				},
				error: () => {
					this.isDocumentUploading$$.next(false);
					if (isLimitExceeded) {
						this.notificationSvc.showNotification(Translate.Error.UploadLimitExceeded[this.selectedLang], NotificationType.DANGER);
					}
				},
			});
	}


	/**
	 * Ignore await response.
	 * @param file
	 * @returns
	 */
	private uploadDocument(file: any, uniqueId = '') {
		const fileSizeExceedsLimit = file.size / 1024 / 1024 > this.fileSize;
		if (fileSizeExceedsLimit) {
			this.documentListError$$.next([...this.documentListError$$.value, { fileName: file.name, error: 'fileLimit' }]);
			return;
		}
		if (this.checkFileExtensions(file)) {
			this.documentListError$$.next([...this.documentListError$$.value, { fileName: file.name, error: 'fileFormat' }]);
			return;
		}
		return new Promise((resolve) => {
			this.appointmentApiSvc
				.uploadDocumnet(file, uniqueId, `${this.modalData?.appointment?.id ?? 0}`)
				.pipe(take(1))
				.subscribe({
					next: (res) => {
						this.appointmentForm.patchValue({
							qrCodeId: res?.apmtDocUniqueId,
						});
						this.notificationSvc.showNotification(Translate.AddedSuccess(file?.name)[this.selectedLang], NotificationType.SUCCESS);
						resolve(res);
					},
					error: (err) => {
						this.notificationSvc.showNotification(Translate.Error.FailedToUpload[this.selectedLang], NotificationType.DANGER);
						resolve(err);
					},
				});
		});
	}

	public viewDocument(id?: number) {
		this.modalSvc.open(DocumentViewModalComponent, {
			data: {
				id: this.modalData?.appointment?.id ?? this.formValues.qrCodeId,
				documentList: this.documentList$$.value,
				focusedDocId: id,
			},
			options: {
				size: 'xl',
				backdrop: true,
				centered: true,
				modalDialogClass: 'ad-ap-modal-shadow',
			},
		});
	}

	public clearFile(document: Document) {
		this.appointmentApiSvc.deleteDocument(document.id).pipe(takeUntil(this.destroy$$)).subscribe();
		this.notificationSvc.showNotification(Translate.DeleteSuccess(document.fileName)[this.selectedLang], NotificationType.SUCCESS);
		this.documentList$$.next(this.documentList$$.value?.filter((item) => item?.id !== document?.id));
	}

	private getDocument(id: number) {
		this.appointmentApiSvc
			.getDocumentById$(id, true)
			.pipe(take(1))
			.subscribe((documentList) => {
				this.documentList$$.next(documentList);
			});
	}
}
