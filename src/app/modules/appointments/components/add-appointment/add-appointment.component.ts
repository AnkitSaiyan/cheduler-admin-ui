import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { NotificationType } from 'diflexmo-angular-design';
import { BehaviorSubject, debounceTime, filter, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { LoaderService } from 'src/app/core/services/loader.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { DocumentViewModalComponent } from 'src/app/shared/components/document-view-modal/document-view-modal.component';
import { Document } from 'src/app/shared/models/document.model';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';
import { SiteManagementApiService } from '../../../../core/services/site-management-api.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NameValue } from '../../../../shared/components/search-modal.component';
import {
	AddAppointmentRequestData,
	AddOutSideOperatingHoursAppointmentRequest,
	Appointment,
	AppointmentSlotsRequestData,
	CreateAppointmentFormValues,
	SelectedSlots,
	Slot,
	SlotModified,
} from '../../../../shared/models/appointment.model';
import { DateDistributed } from '../../../../shared/models/calendar.model';
import { RoomType } from '../../../../shared/models/rooms.model';
import { AppointmentStatus } from '../../../../shared/models/status.model';
import { Translate } from '../../../../shared/models/translate.model';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { AppointmentUtils } from '../../../../shared/utils/appointment.utils';
import { APPOINTMENT_ID, COMING_FROM_ROUTE, DUTCH_BE, EDIT, EMAIL_REGEX, ENG_BE } from '../../../../shared/utils/const';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { CustomDateParserFormatter } from '../../../../shared/utils/dateFormat';
import { GeneralUtils } from '../../../../shared/utils/general.utils';

@Component({
	selector: 'dfm-add-appointment',
	templateUrl: './add-appointment.component.html',
	styleUrls: ['./add-appointment.component.scss'],
	providers: [{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }],
})
export class AddAppointmentComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public appointmentForm!: FormGroup;

	public appointment$$ = new BehaviorSubject<Appointment | undefined>(undefined);

	public loading$$ = new BehaviorSubject(false);

	public loadingSlots$$ = new BehaviorSubject<boolean>(false);

	public submitting$$ = new BehaviorSubject(false);

	private selectedLang: string = ENG_BE;

	public filteredUserList: NameValue[] = [];

	public filteredExamList: NameValue[] = [];

	public filteredPhysicianList: NameValue[] = [];

	public roomType = RoomType;

	public edit = false;

	public comingFromRoute = '';

	examsData = [
		{
			name: 'Aanpasing steunzolen',
			value: 1,
		},
		{
			name: 'Levering steunzolen',
			value: 2,
		},
		{
			name: 'Maatname',
			value: 3,
		},
	];

	public examIdToDetails: { [key: number]: { name: string; expensive: number } } = {};

	public slots: SlotModified[] = [];

	public selectedTimeSlot: SelectedSlots = {};

	public examIdToAppointmentSlots: { [key: number]: SlotModified[] } = {};

	public isSlotUpdated = false;

	public slots$$ = new BehaviorSubject<any>(null);

	public isCombinable: boolean = false;

	public isDoctorConsentDisable$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	private userList: NameValue[] = [];

	private examList: NameValue[] = [];

	private physicianList: NameValue[] = [];

	public dateControl = new FormControl();

	public currentDate = new Date();

	public isOutside: boolean | undefined = false;

	private staffs: NameValue[] = [];

	public filteredStaffs: NameValue[] = [];

	public uploadFileName!: string;

	public fileSize!: number;

	private fileMaxCount!: number;

	public documentList$$ = new BehaviorSubject<Document[]>([]);

	public documentListError$$: BehaviorSubject<{ fileName: string; error: 'fileFormat' | 'fileLimit' }[]> = new BehaviorSubject<
		{ fileName: string; error: 'fileFormat' | 'fileLimit' }[]
	>([]);

	public isDocumentUploading$$ = new BehaviorSubject<number>(0);

	constructor(
		private fb: FormBuilder,
		private notificationSvc: NotificationDataService,
		private appointmentApiSvc: AppointmentApiService,
		private userApiService: UserApiService,
		private examApiService: ExamApiService,
		private physicianApiSvc: PhysicianApiService,
		private nameValuePipe: NameValuePairPipe,
		private router: Router,
		private route: ActivatedRoute,
		private shareDataService: ShareDataService,
		private siteManagementApiSvc: SiteManagementApiService,
		private cdr: ChangeDetectorRef,
		private loaderService: LoaderService,
		private shareDataSvc: ShareDataService,
		private modalSvc: ModalService,
	) {
		super();

		const state = this.router.getCurrentNavigation()?.extras?.state;
		if (state !== undefined) {
			this.loading$$.next(true);
			this.comingFromRoute = state[COMING_FROM_ROUTE];
			this.edit = state[EDIT];

			localStorage.setItem(COMING_FROM_ROUTE, this.comingFromRoute);
			if (typeof this.edit === 'boolean') {
				localStorage.setItem(EDIT, this.edit.toString());
			}
		} else {
			this.loading$$.next(true);
			this.getComingFromRouteFromLocalStorage();
		}
	}

	public get formValues(): CreateAppointmentFormValues {
		return this.appointmentForm?.value;
	}

	public get selcectedExamList(): Array<any> {
		return this.appointmentForm?.value.examList || [];
	}

	public ngOnInit(): void {
		this.createForm();

		this.siteManagementApiSvc.siteManagementData$.pipe(take(1)).subscribe((siteSettings) => {
			this.isCombinable = siteSettings.isSlotsCombinable;
			this.fileSize = siteSettings.documentSizeInKb / 1024;
			this.isDoctorConsentDisable$$.next(siteSettings.doctorReferringConsent === 1);
			this.fileMaxCount = siteSettings.docUploadMaxCount;
		});

		this.examApiService.allExams$.pipe(takeUntil(this.destroy$$)).subscribe((exams) => {
			const keyValueExams = this.nameValuePipe.transform(exams, 'name', 'id');
			this.filteredExamList = [...keyValueExams];
			this.examList = [...keyValueExams];
			exams.forEach((exam) => {
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

		this.route.params
			.pipe(
				map((params) => params[APPOINTMENT_ID]),
				filter((appointmentID: string) => {
					if (!appointmentID) {
						this.appointment$$.next({} as Appointment);
					}
					return !!appointmentID;
				}),
				switchMap((appointmentID) => {
					return this.appointmentApiSvc.getAppointmentByID$(+appointmentID);
				}),
				debounceTime(0),
				takeUntil(this.destroy$$),
			)
			.subscribe((appointment) => {
				this.loaderService.spinnerActivate();
				this.appointment$$.next(appointment ?? ({} as Appointment));
				this.updateForm(appointment);
				if (appointment?.id && appointment.documentCount) this.getDocument(appointment.id);
			});

		this.appointmentForm
			?.get('startedAt')
			?.valueChanges.pipe(
				debounceTime(0),
				filter((startedAt) => {
					return startedAt?.day && this.formValues.examList?.length;
				}),
				tap(() => this.loadingSlots$$.next(true)),
				map((date) => {
					this.clearSlotDetails();
					return AppointmentUtils.GenerateSlotRequestData(date, this.formValues.examList);
				}),
				switchMap((reqData) => this.getSlotData(reqData)),
				takeUntil(this.destroy$$),
			)
			.subscribe((slots) => {
				this.setSlots(slots[0].slots, slots[0]?.isCombined);
				this.loadingSlots$$.next(false);
			});

		this.appointmentForm
			.get('examList')
			?.valueChanges.pipe(
				debounceTime(0),
				filter((examList) => examList?.length && this.formValues.startedAt?.day),
				tap(() => this.loadingSlots$$.next(true)),
				map((examList) => {
					this.clearSlotDetails();

					return AppointmentUtils.GenerateSlotRequestData(this.formValues.startedAt, examList);
				}),
				switchMap((reqData) => this.getSlotData(reqData)),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (slots) => {
					this.setSlots(slots[0].slots, this.isCombinable);
					this.loadingSlots$$.next(false);
				},
				error: () => this.loadingSlots$$.next(false),
			});
		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => {
					this.selectedLang = lang;

					// eslint-disable-next-line default-case
					switch (lang) {
						case ENG_BE:
							break;
						case DUTCH_BE:
							break;
					}
				},
			});

		this.userApiService.allStaffs$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (staffs) => {
				const keyValueExams = this.nameValuePipe.transform(staffs, 'fullName', 'id');
				this.staffs = [...keyValueExams];
				this.filteredUserList = [...keyValueExams];
				this.userList = [...keyValueExams];
				this.filteredStaffs = [...this.staffs];
			},
		});
	}

	public override ngOnDestroy() {
		localStorage.removeItem(COMING_FROM_ROUTE);
		localStorage.removeItem(EDIT);
		super.ngOnDestroy();
	}

	public getSlotData(reqData: AppointmentSlotsRequestData) {
		return this.appointmentApiSvc.getSlots$({ ...reqData, AppointmentId: this.appointment$$?.value?.id ?? 0 });
	}

	public saveAppointment(): void {
		try {
			if (this.appointmentForm.invalid) {
				this.notificationSvc.showNotification(`${Translate.FormInvalid[this.selectedLang]}.`, NotificationType.WARNING);
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
				{ ...(this.appointment$$.value ?? ({} as Appointment)) },
				this.isCombinable,
			);

			if (this.isDoctorConsentDisable$$.value) {
				delete requestData.doctorId;
			}

			this.saveDataToBackend(requestData);
		} catch (e) {
			this.notificationSvc.showNotification(`${Translate.Error.FailedToSave[this.selectedLang]}`, NotificationType.DANGER);
			this.submitting$$.next(false);
		}
	}

	private saveDataToBackend(requestData: AddAppointmentRequestData) {
		if (this.edit) {
			this.appointmentApiSvc
				.updateAppointment$(requestData)
				.pipe(takeUntil(this.destroy$$))
				.subscribe({
					next: () => {
						this.notificationSvc.showNotification(`${Translate.AppointmentUpdatedSuccessfully[this.selectedLang]}`);

						this.navigationAfterAddAppointment();
					},
					error: () => {
						this.submitting$$.next(false);
					},
				});
		} else {
			this.appointmentApiSvc
				.saveAppointment$(requestData)
				.pipe(takeUntil(this.destroy$$))
				.subscribe({
					next: () => {
						this.notificationSvc.showNotification(`${Translate.AppointmentSavedSuccessfully[this.selectedLang]}`);
						this.navigationAfterAddAppointment();
					},
					error: () => {
						this.submitting$$.next(false);
					},
				});
		}
	}

	private navigationAfterAddAppointment() {
		this.submitting$$.next(false);

		let route: string;
		switch (this.comingFromRoute) {
			case 'view':
				route = '../view';
				break;
			case 'dashboard':
				route = '/';
				break;
			default:
				route = this.edit ? '/appointment' : '../';
		}
		this.router.navigate([route], { relativeTo: this.route, queryParamsHandling: 'merge' });
	}

	public saveOutSideOperatingHoursAppointment() {
		try {
			if (this.appointmentForm.invalid) {
				this.notificationSvc.showNotification(`${Translate.FormInvalid[this.selectedLang]}.`, NotificationType.WARNING);
				this.appointmentForm.markAllAsTouched();
				return;
			}
			this.submitting$$.next(true);

			const appointment = { ...(this.appointment$$.value ?? ({} as Appointment)) };

			const { startedAt, startTime, ...rest } = this.formValues;

			const requestData: AddOutSideOperatingHoursAppointmentRequest = {
				...rest,
				startedAt: appointment?.exams?.[0].startedAt,
				rejectReason: '',
				fromPatient: false,
				id: appointment.id,
			};

			this.appointmentApiSvc
				.saveOutSideOperatingHoursAppointment$(requestData, 'update')
				.pipe(takeUntil(this.destroy$$))
				.subscribe({
					next: () => {
						this.shareDataService.getLanguage$().subscribe((language: string) => {
							this.notificationSvc.showNotification(language === ENG_BE ? `Appointment updated successfully` : 'Afspraak succesvol geupdated');
						});
						this.submitting$$.next(false);
						let route: string;

						if (this.comingFromRoute === 'view') {
							route = '../view';
						} else {
							route = this.edit ? '/appointment' : '/dashboard';
						}
						this.router.navigate([route], { relativeTo: this.route, queryParamsHandling: 'merge' });
					},
					error: () => {
						this.submitting$$.next(false);
					},
				});
		} catch (e) {
			this.notificationSvc.showNotification(`${Translate.Error.FailedToSave[this.selectedLang]}`, NotificationType.DANGER);
			this.submitting$$.next(false);
		}
	}

	public checkSlotAvailability(slot: SlotModified) {
		return AppointmentUtils.IsSlotAvailable(slot, this.selectedTimeSlot);
	}

	public handleSlotSelectionToggle(slots: SlotModified, isEdit: boolean = false) {
		AppointmentUtils.ToggleSlotSelection(slots, this.selectedTimeSlot, isEdit);
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

	public clearSlotDetails() {
		this.examIdToAppointmentSlots = {};
		this.selectedTimeSlot = {};
		this.slots = [];
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

	private getComingFromRouteFromLocalStorage() {
		const comingFromRoute = localStorage.getItem(COMING_FROM_ROUTE);
		if (comingFromRoute) {
			this.comingFromRoute = comingFromRoute;
		}
		const edit = localStorage.getItem(EDIT);
		if (edit) {
			this.edit = edit === 'true';
		}
	}

	private createForm(): void {
		this.appointmentForm = this.fb.group({
			patientFname: ['', [Validators.required]],
			patientLname: ['', [Validators.required]],
			patientTel: [null, [Validators.required]],
			patientEmail: ['', []],
			doctorId: [null, []],
			startedAt: ['', [Validators.required]],
			startTime: [null, []],
			examList: [[], [Validators.required]],
			userId: [null, [Validators.required]],
			comments: ['', []],
			approval: [AppointmentStatus.Pending, []],
			socialSecurityNumber: [null, []],
			qrCodeId: [null, []],
		});
	}

	private updateForm(appointment: Appointment | undefined) {
		let date!: Date;
		let dateDistributed: DateDistributed = {} as DateDistributed;
		this.isOutside = appointment?.isOutside;

		if (this.isOutside) this.appointmentForm.addControl('userList', new FormControl([]));

		appointment?.exams?.sort((exam1, exam2) => {
			if (exam1.startedAt < exam2.startedAt) {
				return -1;
			}
			return 1;
		});
		if (appointment?.startedAt) {
			date = new Date(appointment.startedAt);
		} else if (appointment?.exams?.[0]?.startedAt) {
			date = new Date(appointment?.exams?.[0]?.startedAt);
		}

		dateDistributed = DateTimeUtils.DateToDateDistributed(date);

		this.updateFormValues(appointment, date, dateDistributed);

		const examList = appointment?.exams?.map((exam) => exam.id) ?? [];

		if (!examList?.length) {
			return;
		}

		this.loadingSlots$$.next(true);

		this.setSlotData(appointment, dateDistributed, examList);
	}

	private setSlotData(appointment: Appointment | undefined, dateDistributed: DateDistributed, examList: any) {
		setTimeout(() => {
			this.loaderService.spinnerDeactivate();
			this.getSlotData(AppointmentUtils.GenerateSlotRequestData(dateDistributed, examList))
				.pipe(take(1))
				.subscribe((slots) => {
					if (!this.isOutside) this.setSlots(slots[0].slots, this.isCombinable);

					this.loadingSlots$$.next(false);

					const slotData = (start, end, examId, roomList, userList) =>
						({
							start,
							end,
							roomList,
							userList,
							examId,
						} as SlotModified);

					if (appointment?.exams?.length) {
						const exams = [...appointment.exams];

						exams.forEach((exam) => {
							const start = DateTimeUtils.DateTo24TimeString(exam.startedAt);
							const end = DateTimeUtils.DateTo24TimeString(exam.endedAt);
							const userList = exam.users?.filter((u) => +u.examId === +exam.id)?.map((u) => +u.id) ?? [];
							const roomList = [
								...(exam.rooms
									?.filter((r) => +r.examId === +exam.id)
									?.map((r) => ({
										start: (r?.startedAt as string)?.slice(-8),
										end: (r?.endedAt as string)?.slice(-8),
										roomId: +r.id,
									})) ?? []),
							];

							this.handleSlotSelectionToggle(
								slotData(
									this.isCombinable ? DateTimeUtils.DateTo24TimeString(appointment.startedAt) : start,
									this.isCombinable ? DateTimeUtils.DateTo24TimeString(appointment.endedAt) : end,
									+exam.id,
									roomList,
									userList,
								),
								!!appointment.id,
							);
						});
					}
					this.cdr.detectChanges();
				});
		}, 600);
	}

	private updateFormValues(appointment: Appointment | undefined, date: Date, dateDistributed: DateDistributed) {
		setTimeout(() => {
			this.appointmentForm.patchValue(
				{
					patientFname: appointment?.patientFname ?? null,
					patientLname: appointment?.patientLname ?? null,
					patientTel: appointment?.patientTel ?? null,
					patientEmail: appointment?.patientEmail ?? null,
					doctorId: appointment?.doctorId?.toString() ?? null,
					startedAt: dateDistributed,
					examList: appointment?.exams?.map((exam) => exam.id?.toString()) ?? [],
					userId: appointment?.userId?.toString() ?? null,
					comments: appointment?.comments ?? null,
					approval: appointment?.approval ?? AppointmentStatus.Pending,
					socialSecurityNumber: appointment?.socialSecurityNumber ?? null,
					qrCodeId: appointment?.id ?? null,
				},
				{ emitEvent: false },
			);
			this.appointmentForm.get('userList')?.setValue(appointment?.usersDetail.map((user) => user.id?.toString() ?? []));

			if (!appointment?.exams?.length) {
				this.appointmentForm.get('examList')?.markAsUntouched();
			}
			this.dateControl.setValue(date);

			const varified = Boolean(appointment?.patientAzureId);

			if (varified) {
				['patientFname', 'patientLname', 'patientTel', 'patientEmail'].forEach((key) => {
					this.appointmentForm.get(key)?.disable();
				});
			}
		}, 500);
	}

	private findSlot(examID: number, start: string, end: string): SlotModified | undefined {
		if (this.examIdToAppointmentSlots[examID]?.length) {
			return this.examIdToAppointmentSlots[examID].find((slot) => slot.start === start && slot.end === end);
		}
		return undefined;
	}

	private setSlots(slots: Slot[], isCombinable: boolean) {
		const { examIdToSlots, newSlots } = AppointmentUtils.GetModifiedSlotData(slots, isCombinable);

		this.examIdToAppointmentSlots = examIdToSlots;
		this.slots = newSlots;
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
		if (this.fileMaxCount === this.documentList$$.value?.length) {
			this.notificationSvc.showNotification(Translate.Error.UploadLimitExceeded[this.selectedLang], NotificationType.DANGER);
			return;
		}

		if (this.fileMaxCount < this.documentList$$.value?.length + transformedDataArray?.length) {
			this.notificationSvc.showNotification(Translate.Error.UploadLimitExceeded[this.selectedLang], NotificationType.DANGER);
			transformedDataArray?.splice(this.fileMaxCount - this.documentList$$.value?.length);
		}
		console.log(transformedDataArray);
		for (const file of transformedDataArray) {
			if (!this.formValues.qrCodeId) {
				await this.uploadDocument(file);
			} else {
				this.uploadDocument(file, this.formValues.qrCodeId);
			}
		}
	}

	private handleInvalidFile(errorMessage: string): void {
		this.notificationSvc.showNotification(errorMessage, NotificationType.WARNING);
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
			this.isDocumentUploading$$.next(this.isDocumentUploading$$.value + 1);
			this.appointmentApiSvc
				.uploadDocumnet(file, uniqueId, `${this.appointment$$?.value?.id ?? 0}`)
				.pipe(
					take(1),
					switchMap((res) => {
						this.appointmentForm.patchValue({
							qrCodeId: res?.apmtDocUniqueId,
						});
						return this.appointmentApiSvc.getDocumentById$(res.apmtDocUniqueId, true);
					}),
				)
				.subscribe({
					next: (documentList) => {
						this.documentList$$.next(documentList);
						this.notificationSvc.showNotification(Translate.AddedSuccess(file?.name)[this.selectedLang], NotificationType.SUCCESS);
						this.isDocumentUploading$$.next(this.isDocumentUploading$$.value - 1);
						resolve(documentList);
					},
					error: (err) => {
						this.notificationSvc.showNotification(Translate.Error.FailedToUpload[this.selectedLang], NotificationType.DANGER);
						this.isDocumentUploading$$.next(this.isDocumentUploading$$.value - 1);
						resolve(err);
					},
				});
		});
	}

	public viewDocument(id?: number) {
		this.modalSvc.open(DocumentViewModalComponent, {
			data: {
				id: this.appointment$$?.value?.id ?? this.formValues.qrCodeId,
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
