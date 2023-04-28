import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BehaviorSubject, combineLatest, debounceTime, filter, map, switchMap, take, takeUntil, tap} from 'rxjs';
import {NotificationType} from 'diflexmo-angular-design';
import {ModalService} from '../../../../core/services/modal.service';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {ShareDataService} from '../../../../core/services/share-data.service';
import {ExamApiService} from '../../../../core/services/exam-api.service';
import {NameValuePairPipe} from '../../../../shared/pipes/name-value-pair.pipe';
import {NameValue} from '../../../../shared/components/search-modal.component';
import {AppointmentApiService} from '../../../../core/services/appointment-api.service';
import {
    AddAppointmentRequestData,
    Appointment,
    CreateAppointmentFormValues,
    SelectedSlots,
    Slot,
    SlotModified
} from '../../../../shared/models/appointment.model';
import {PhysicianApiService} from '../../../../core/services/physician.api.service';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {AppointmentUtils} from '../../../../shared/utils/appointment.utils';
import {SiteManagementApiService} from '../../../../core/services/site-management-api.service';
import {EMAIL_REGEX, ENG_BE} from '../../../../shared/utils/const';
import {GeneralUtils} from '../../../../shared/utils/general.utils';
import {Translate} from "../../../../shared/models/translate.model";
import {DateTimeUtils} from "../../../../shared/utils/date-time.utils";
import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {CustomDateParserFormatter} from '../../../..//shared/utils/dateFormat';
import {getDurationMinutes} from 'src/app/shared/models/calendar.model';
import {UserApiService} from "../../../../core/services/user-api.service";
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';

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

	public currentDate = DateTimeUtils.DateToDateDistributed(new Date());

	public isDoctorConsentDisable$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	private examList: NameValue[] = [];
	private physicianList: NameValue[] = [];
	private userList: NameValue[] = [];
	private modalData!: {
		event: MouseEvent;
		element: HTMLDivElement;
		elementContainer: HTMLDivElement;
		startedAt: Date;
		startTime?: string;
		limit?: { min: string; max: string; grayOutMin: string; grayOutMax: string };
	};
	private pixelPerMinute = 4;
	private selectedLang = ENG_BE;
	private currentSlot$$ = new BehaviorSubject<any[]>([]);

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
		private utcToLocalPipe: UtcToLocalPipe,
	) {
		super();
	}

	public get formValues(): CreateAppointmentFormValues {
		return this.appointmentForm?.value;
	}

	public ngOnInit(): void {
		this.siteManagementApiSvc.siteManagementData$.pipe(take(1)).subscribe((siteSettings) => {
			this.isCombinable = siteSettings.isSlotsCombinable;
			this.isDoctorConsentDisable$$.next(siteSettings.doctorReferringConsent === 1);
		});

		this.modalSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data) => {
			this.modalData = data;

			if (this.modalData.event.offsetY) {
				let minutes = Math.round(+this.modalData.event.offsetY / this.pixelPerMinute);
				if (this.modalData?.limit) {
					minutes += getDurationMinutes(this.myDate('00:00:00'), this.myDate(this.modalData.limit.min));
				}

				// In case if calendar start time is not 00:00 then adding extra minutes
				if (this.modalData?.startTime) {
					const startTime = this.modalData.startTime.split(':');
					minutes += DateTimeUtils.DurationInMinFromHour(+startTime[0], +startTime[1]);
				}

				const roundedMin = minutes - (minutes % 5);

				const hour = `0${Math.floor(minutes / 60)}`.slice(-2);
				const min = `0${roundedMin % 60}`.slice(-2);
				// this.selectedTimeInUTC = this.utcToLocalPipe.transform(`${hour}:${min}`, true) + ':00';
				this.selectedTimeInUTCOrig = `${hour}:${min}:00`;
				this.selectedTimeInUTC = this.selectedTimeInUTCOrig;

				console.log('utc', this.selectedTimeInUTC);
			}
		});

		this.createForm();

		combineLatest([this.appointmentForm.get('examList')?.valueChanges.pipe(filter((examList) => !!examList?.length))])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe((res) => {});

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

			exams.forEach((exam) => {
				if (!this.examIdToDetails[+exam.id]) {
					this.examIdToDetails[+exam.id] = {
						name: exam.name,
						expensive: exam.expensive,
					};
				}
			});
		});

		this.physicianApiSvc.physicians$.pipe(takeUntil(this.destroy$$)).subscribe((physicians) => {
			const keyValuePhysicians = this.nameValuePipe.transform(physicians, 'fullName', 'id');
			this.filteredPhysicianList = [...keyValuePhysicians];
			this.physicianList = [...keyValuePhysicians];
		});

		this.userApiService.allGeneralUsers$.pipe(takeUntil(this.destroy$$)).subscribe((users) => {
			const keyValueExams = this.nameValuePipe.transform(users, 'fullName', 'id');
			this.filteredUserList = [...keyValueExams];
			this.userList = [...keyValueExams];
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
				switchMap((reqData) => this.appointmentApiSvc.getSlots$(reqData)),
			)
			.subscribe((slots) => {
				this.setSlots(slots[0].slots, slots[0]?.isCombined);
				this.loadingSlots$$.next(false);
			});

		this.appointmentForm
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
				switchMap((reqData) => this.appointmentApiSvc.getSlots$(reqData)),
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
				this.loadingSlots$$.next(false);
			});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => (this.selectedLang = lang));
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public close(result: boolean) {
		this.modalSvc.close(result);
	}

	public checkSlotAvailability(slot: SlotModified) {
		return AppointmentUtils.IsSlotAvailable(slot, this.selectedTimeSlot, this.isCombinable);
	}

	public handleSlotSelectionToggle(slots: SlotModified) {
		AppointmentUtils.ToggleSlotSelection(slots, this.selectedTimeSlot, this.isCombinable);

		console.log(slots);

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
			this.notificationSvc.showNotification(`${Translate.FormInvalidSimple[this.selectedLang]}!`, NotificationType.WARNING);
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

		console.log(requestData);
		if (this.isDoctorConsentDisable$$.value) {
			delete requestData.doctorId;
		}

		this.appointmentApiSvc
			.saveAppointment$(requestData)
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: () => {
					this.notificationSvc.showNotification(`${Translate.SuccessMessage.AppointmentAdded[this.selectedLang]}!`);
					this.submitting$$.next(false);
					this.modalSvc.close(true);
				},
				error: (err) => {
					this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
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

		if (!inputText.match(EMAIL_REGEX)) {
			this.appointmentForm.get('patientEmail')?.setErrors({
				email: true,
			});
		} else {
			this.appointmentForm.get('patientEmail')?.setErrors(null);
		}
	}

	public handleDropdownSearch(searchText: string, type: 'user' | 'doctor' | 'exam'): void {
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
		}
	}

	@HostListener('document:keyup.esc')
	private onKeyup() {
		if (this.modalData?.element) {
			this.modalData.element.remove();
		}
	}

	private myDate(date: string): Date {
		const formattedDate = new Date();
		const splitDate = date.split(':');
		formattedDate.setHours(+splitDate[0]);
		formattedDate.setMinutes(+splitDate[1]);
		formattedDate.setSeconds(0);
		return formattedDate;
	}

	private createForm() {
		this.appointmentForm = this.fb.group({
			patientFname: [null, [Validators.required]],
			patientLname: [null, [Validators.required]],
			patientTel: [null, [Validators.required]],
			patientEmail: [null, []],
			doctorId: [null, []],
			startedAt: [null, [Validators.required]],
			// startTime: [null, [Validators.required]],
			// roomType: [null, [Validators.required]],
			examList: [[], [Validators.required]],
			userId: [null, [Validators.required]],
			comments: [null, []],
		});

		if (this.modalData?.startedAt) {
			const date = new Date(this.modalData.startedAt);
			const startedAt = {
				year: date.getFullYear(),
				month: date.getMonth() + 1,
				day: date.getDate(),
			};
			this.appointmentForm.patchValue({ startedAt }, { emitEvent: true });
		}
	}

	private setSlots(slots: Slot[], isCombinable: boolean) {
		const { examIdToSlots, newSlots } = AppointmentUtils.GetModifiedSlotData(slots, isCombinable);

		this.examIdToAppointmentSlots = examIdToSlots;
		this.slots = newSlots;
	}

	private updateEventCard(slot?: Slot) {
		const { element } = this.modalData;
		let totalExpense = 0;

		this.formValues.examList.forEach((examID) => {
			const expensive = +this.examIdToDetails[+examID].expensive;

			if (!Number.isNaN(+expensive)) {
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
		this.modalData.element.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
	}
}
