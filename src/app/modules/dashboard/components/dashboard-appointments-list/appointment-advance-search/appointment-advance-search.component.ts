import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, map, take, takeUntil } from 'rxjs';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { DestroyableComponent } from '../../../../../shared/components/destroyable.component';
import { RoomType } from '../../../../../shared/models/rooms.model';
import { NameValue } from '../../../../../shared/components/search-modal.component';
import { RoomsApiService } from '../../../../../core/services/rooms-api.service';
import { ExamApiService } from '../../../../../core/services/exam-api.service';
import { NameValuePairPipe } from '../../../../../shared/pipes/name-value-pair.pipe';
import { TimeInIntervalPipe } from '../../../../../shared/pipes/time-in-interval.pipe';
import { PhysicianApiService } from '../../../../../core/services/physician.api.service';
import { Appointment, CreateAppointmentFormValues, SelectedSlots, SlotModified } from '../../../../../shared/models/appointment.model';
import { COMING_FROM_ROUTE, EDIT, EMAIL_REGEX } from '../../../../../shared/utils/const';
import { SiteManagementApiService } from '../../../../../core/services/site-management-api.service';
import { DateTimeUtils } from '../../../../../shared/utils/date-time.utils';
import { GeneralUtils } from '../../../../../shared/utils/general.utils';
import { CustomDateParserFormatter } from '../../../../../shared/utils/dateFormat';
import { UserApiService } from '../../../../../core/services/user-api.service';

@Component({
	selector: 'dfm-appointment-advance-search',
	templateUrl: './appointment-advance-search.component.html',
	styleUrls: ['./appointment-advance-search.component.scss'],
	providers: [{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }],
})
export class AppointmentAdvanceSearchComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public appointmentForm!: FormGroup;

	public appointment$$ = new BehaviorSubject<Appointment | undefined>(undefined);

	public loading$$ = new BehaviorSubject(true);

	public loadingSlots$$ = new BehaviorSubject<boolean>(false);

	public submitting$$ = new BehaviorSubject(false);

	public filteredUserList: NameValue[] = [];

	public filteredExamList: NameValue[] = [];

	public filteredRoomList: NameValue[] = [];

	public roomList: NameValue[] = [];

	public filteredPhysicianList: NameValue[] = [];

	public filteredPatientsList: NameValue[] = [];

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

	public isCombinable: boolean = false;

	public startTimes: NameValue[];

	public endTimes: NameValue[];

	public dialogData = {
		confirmButtonText: 'Proceed',
		cancelButtonText: 'Cancel',
		titleText: 'Confirmation',
		bodyText: 'Are you sure you want to perform this action?',
	};

	private userList: NameValue[] = [];

	private examList: NameValue[] = [];

	private physicianList: NameValue[] = [];

	private patientList: NameValue[] = [];

	private times: NameValue[];

	public statusList: NameValue[] = [];

	public currentDate = new Date();

	private advanceSearchData: any;

	constructor(
		private dialogSvc: ModalService,
		private fb: FormBuilder,
		private roomApiSvc: RoomsApiService,
		private userApiService: UserApiService,
		private examApiService: ExamApiService,
		private physicianApiSvc: PhysicianApiService,
		private nameValuePipe: NameValuePairPipe,
		private timeInIntervalPipe: TimeInIntervalPipe,
		private shareDataService: ShareDataService,
		private siteManagementApiSvc: SiteManagementApiService,
	) {
		super();
		this.times = this.nameValuePipe.transform(this.timeInIntervalPipe.transform(5));
		this.startTimes = [...this.times];
		this.endTimes = [...this.times];
	}

	public get formValues(): CreateAppointmentFormValues {
		return this.appointmentForm?.value;
	}

	public ngOnInit(): void {
		this.dialogSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data) => {
			if (data.bodyText) this.dialogData.bodyText = data.bodyText;
			if (data.titleText) this.dialogData.titleText = data.titleText;
			if (data.confirmButtonText) this.dialogData.confirmButtonText = data.confirmButtonText;
			if (data.cancelButtonText) this.dialogData.cancelButtonText = data.cancelButtonText;
			if (data.values) this.advanceSearchData = data.values;
		});

		this.createForm();

		this.shareDataService.AppointmentStatus$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => (this.statusList = items),
		});

		this.siteManagementApiSvc.siteManagementData$.pipe(take(1)).subscribe((siteSettings) => {
			this.isCombinable = siteSettings.isSlotsCombinable;
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

		this.userApiService.allStaffs$.pipe(takeUntil(this.destroy$$)).subscribe((staffs) => {
			const keyValueExams = this.nameValuePipe.transform(staffs, 'fullName', 'id');
			this.filteredUserList = [...keyValueExams];
			this.userList = [...keyValueExams];
		});

		this.roomApiSvc.allRooms$.pipe(takeUntil(this.destroy$$)).subscribe((staffs) => {
			const keyValueExams = this.nameValuePipe.transform(staffs, 'name', 'id');
			this.filteredRoomList = [...keyValueExams];

			this.roomList = [...keyValueExams];
		});

		this.physicianApiSvc.allPhysicians$.pipe(takeUntil(this.destroy$$)).subscribe((physicians) => {
			const keyValuePhysicians = this.nameValuePipe.transform(physicians, 'fullName', 'id');
			this.filteredPhysicianList = [...keyValuePhysicians];
			this.physicianList = [...keyValuePhysicians];
		});

		this.shareDataService.patient$
			.pipe(
				takeUntil(this.destroy$$),
				map((values) => {
					return values.filter((val) => val.patientFname && val.patientLname);
				}),
			)
			.subscribe((physicians) => {
				const tempKeyValue = physicians.map((val) => ({
					// eslint-disable-next-line no-unsafe-optional-chaining
					name: val.patientFname ? `${val.patientFname?.toString()}  ${val.patientLname?.toString()}` : val?.toString(),

					// eslint-disable-next-line no-unsafe-optional-chaining
					value: val.patientFname
						? `${val.patientFname?.toString()}:${val.patientLname?.toString()}:${val.appointmentId?.toString()}`
						: val?.toString(),
				}));
				this.filteredPatientsList = [...tempKeyValue];
				this.patientList = [...tempKeyValue];
			});
	}

	public override ngOnDestroy() {
		localStorage.removeItem(COMING_FROM_ROUTE);
		localStorage.removeItem(EDIT);
		super.ngOnDestroy();
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

	public handleDropdownSearch(searchText: string, type: 'user' | 'physician' | 'exam' | 'room' | 'patient'): void {
		switch (type) {
			case 'physician':
				this.filteredPhysicianList = [...GeneralUtils.FilterArray(this.physicianList, searchText, 'name')];
				break;
			case 'user':
				this.filteredUserList = [...GeneralUtils.FilterArray(this.userList, searchText, 'name')];
				break;
			case 'exam':
				this.filteredExamList = [...GeneralUtils.FilterArray(this.examList, searchText, 'name')];
				break;
			case 'room':
				this.filteredRoomList = [...GeneralUtils.FilterArray(this.roomList, searchText, 'name')];
				break;
			case 'patient':
				this.filteredPatientsList = [...GeneralUtils.FilterArray(this.patientList, searchText, 'name')];
				break;
			default:
				break;
		}
	}

	public close() {
		this.dialogSvc.close();
	}

	public resetForm() {
		this.appointmentForm.reset();
	}

	public submitSearch() {
		const data = this.appointmentForm.value;
		if (data?.startedAt) {
			const startDate = DateTimeUtils.DateToDateDistributed(data?.startedAt);
			data.startedAt = `${startDate?.year}-${startDate?.month}-${startDate?.day}`;
		}
		if (data?.startTime) {
			data.startTime = `${DateTimeUtils.LocalToUTCTimeTimeString(data?.startTime)}:00`;
		}
		if (data?.endedAt) {
			const endDate = DateTimeUtils.DateToDateDistributed(data?.endedAt);
			data.endedAt = `${endDate?.year}-${endDate?.month}-${endDate?.day}`;
		}
		if (data?.endTime) {
			data.endTime = `${DateTimeUtils.LocalToUTCTimeTimeString(data?.endTime)}:00`;
		}

		this.dialogSvc.close(data);
	}

	private searchTime(time: string, controlName: 'startTime' | 'endTime') {
		if (controlName === 'startTime') {
			this.startTimes = [...GeneralUtils.FilterArray(this.times, time, 'value')];
			return;
		}
		this.endTimes = [...GeneralUtils.FilterArray(this.times, time, 'value')];
	}

	public handleTimeInput(time: string, controlName: 'startTime' | 'endTime') {
		this.searchTime(time, controlName);
		const formattedTime = DateTimeUtils.FormatTime(time, 24, 5);
		if (!formattedTime) {
			return;
		}

		const nameValue = {
			name: formattedTime,
			value: formattedTime,
		};

		switch (controlName) {
			case 'startTime':
				if (!this.startTimes.find((t) => t.value === formattedTime)) {
					this.startTimes.splice(0, 0, nameValue);
				}
				break;
			case 'endTime':
				if (!this.endTimes.find((t) => t.value === formattedTime)) {
					this.endTimes.splice(0, 0, nameValue);
				}
				break;
			default:
				return;
		}

		this.appointmentForm.patchValue(
			{
				[controlName]: formattedTime,
			},
			{ emitEvent: false },
		);
	}

	private createForm(): void {
		this.appointmentForm = this.fb.group({
			appointmentNumber: [],
			patientId: [null, []],
			roomsId: [null, []],
			doctorId: [null, []],
			examList: [[]],
			userId: [null],
			endedAt: [],
			startedAt: [],
			startTime: [],
			endTime: [],
			approval: [],
		});
		if (this.advanceSearchData) {
			if (this.advanceSearchData.startTime)
				this.advanceSearchData.startTime = DateTimeUtils.UTCTimeToLocalTimeString(this.advanceSearchData.startTime);

			if (this.advanceSearchData.endTime)
				this.advanceSearchData.endTime = DateTimeUtils.UTCTimeToLocalTimeString(this.advanceSearchData.endTime);

			setTimeout(() => {
				this.appointmentForm.setValue(this.advanceSearchData);
				this.loading$$.next(false);
			}, 1500);
		} else {
			this.loading$$.next(false);
		}
	}
}
