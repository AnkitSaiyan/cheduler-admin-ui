import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {BehaviorSubject, debounceTime, filter, switchMap, take, takeUntil} from 'rxjs';
import {NotificationType} from 'diflexmo-angular-design';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {DestroyableComponent} from '../../../../../shared/components/destroyable.component';
import {NotificationDataService} from '../../../../../core/services/notification-data.service';
import {AppointmentApiService} from '../../../../../core/services/appointment-api.service';
import {RoomType} from '../../../../../shared/models/rooms.model';
import {NameValue} from '../../../../../shared/components/search-modal.component';
import {RoomsApiService} from '../../../../../core/services/rooms-api.service';
import {ExamApiService} from '../../../../../core/services/exam-api.service';
import {NameValuePairPipe} from '../../../../../shared/pipes/name-value-pair.pipe';
import {TimeInIntervalPipe} from '../../../../../shared/pipes/time-in-interval.pipe';
import {PhysicianApiService} from '../../../../../core/services/physician.api.service';
import {
  AddAppointmentRequestData,
  Appointment,
  AppointmentSlotsRequestData,
  CreateAppointmentFormValues,
  SelectedSlots,
  SlotModified,
} from '../../../../../shared/models/appointment.model';
import {APPOINTMENT_ID, COMING_FROM_ROUTE, EDIT, EMAIL_REGEX, ENG_BE} from '../../../../../shared/utils/const';
import {RouterStateService} from '../../../../../core/services/router-state.service';
import {AppointmentStatus} from '../../../../../shared/models/status.model';
import {AppointmentUtils} from '../../../../../shared/utils/appointment.utils';
import {SiteManagementApiService} from '../../../../../core/services/site-management-api.service';
import {DateTimeUtils} from '../../../../../shared/utils/date-time.utils';
import {DateDistributed} from '../../../../../shared/models/calendar.model';
import {GeneralUtils} from '../../../../../shared/utils/general.utils';
import {ModalService} from 'src/app/core/services/modal.service';
import {NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
import {CustomDateParserFormatter} from '../../../../../shared/utils/dateFormat';
import {UserApiService} from "../../../../../core/services/user-api.service";

@Component({
    selector: 'dfm-appointment-advance-search',
    templateUrl: './appointment-advance-search.component.html',
    styleUrls: ['./appointment-advance-search.component.scss'],
    providers: [{provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter}],
})
export class AppointmentAdvanceSearchComponent extends DestroyableComponent implements OnInit, OnDestroy {
    public appointmentForm!: FormGroup;

    public appointment$$ = new BehaviorSubject<Appointment | undefined>(undefined);

    public loading$$ = new BehaviorSubject(false);

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

    constructor(
        private dialogSvc: ModalService,
        private fb: FormBuilder,
        private notificationSvc: NotificationDataService,
        private appointmentApiSvc: AppointmentApiService,
        private roomApiSvc: RoomsApiService,
        private userApiService: UserApiService,
        private examApiService: ExamApiService,
        private physicianApiSvc: PhysicianApiService,
        private nameValuePipe: NameValuePairPipe,
        private timeInIntervalPipe: TimeInIntervalPipe,
        private datePipe: DatePipe,
        private routerStateSvc: RouterStateService,
        private router: Router,
        private route: ActivatedRoute,
        private shareDataService: ShareDataService,
        private siteManagementApiSvc: SiteManagementApiService,
        private cdr: ChangeDetectorRef,
    ) {
        super();
        const times = this.nameValuePipe.transform(this.timeInIntervalPipe.transform(5));
        this.startTimes = [...times];
        this.endTimes = [...times];
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
        });

        this.createForm();

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

        this.userApiService
            .allGeneralUsers$
            .pipe(takeUntil(this.destroy$$))
            .subscribe((staffs) => {
                const keyValueExams = this.nameValuePipe.transform(staffs, 'fullName', 'id');
                this.filteredUserList = [...keyValueExams];
                this.userList = [...keyValueExams];
            });

        this.roomApiSvc.allRooms$.pipe(takeUntil(this.destroy$$)).subscribe((staffs) => {
            console.log(staffs);
            const keyValueExams = this.nameValuePipe.transform(staffs, 'name', 'id');
            this.filteredRoomList = [...keyValueExams];

            this.roomList = [...keyValueExams];
        });

        this.physicianApiSvc.physicians$.pipe(takeUntil(this.destroy$$)).subscribe((physicians) => {
            console.log(physicians);
            const keyValuePhysicians = this.nameValuePipe.transform(physicians, 'fullName', 'id');
            this.filteredPhysicianList = [...keyValuePhysicians];
            this.physicianList = [...keyValuePhysicians];
        });

        this.shareDataService.patient$.pipe(takeUntil(this.destroy$$)).subscribe((physicians) => {
            console.log(physicians);
            const keyValuePhysicians = this.nameValuePipe.transform(physicians, 'patientFname', 'appointmentId', 'patientLname');
            const tempKeyValue = physicians.map((val) => ({
                // eslint-disable-next-line no-unsafe-optional-chaining
                name: val.patientFname ? val['patientFname']?.toString() + '  ' + val['patientLname']?.toString() : val?.toString(),

                // eslint-disable-next-line no-unsafe-optional-chaining
                value: val.patientFname ? val['patientFname']?.toString() + ':' + val['patientLname']?.toString() + ':' + val['appointmentId']?.toString() : val?.toString(),
            }));
            this.filteredPatientsList = [...tempKeyValue];
            console.log(this.filteredPatientsList);
            this.patientList = [...tempKeyValue];
        });

        this.routerStateSvc
            .listenForParamChange$(APPOINTMENT_ID)
            .pipe(
                filter((appointmentID: string) => {
                    console.log('appointmentID in filter: ', appointmentID);
                    if (!appointmentID) {
                        this.appointment$$.next({} as Appointment);
                    }
                    return !!appointmentID;
                }),
                switchMap((appointmentID) => {
                    console.log('appointmentID: ', appointmentID);
                    return this.appointmentApiSvc.getAppointmentByID$(+appointmentID);
                }),
                debounceTime(0),
                takeUntil(this.destroy$$),
            )
            .subscribe((appointment) => {
                this.appointment$$.next(appointment ?? ({} as Appointment));
                this.updateForm(appointment);
            });
    }

    public override ngOnDestroy() {
        localStorage.removeItem(COMING_FROM_ROUTE);
        localStorage.removeItem(EDIT);
        super.ngOnDestroy();
    }

    public getSlotData(reqData: AppointmentSlotsRequestData) {
        return this.appointmentApiSvc.getSlots$(reqData);
    }

    public saveAppointment(): void {
        console.log(this.selectedTimeSlot);

        try {
            if (this.appointmentForm.invalid) {
                this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
                Object.keys(this.appointmentForm.controls).forEach((key) => this.appointmentForm.get(key)?.markAsTouched());
                return;
            }

            if (
                (this.isCombinable && !Object.values(this.selectedTimeSlot).length) ||
                (!this.isCombinable && Object.values(this.selectedTimeSlot).length !== this.formValues.examList?.length)
            ) {
                this.notificationSvc.showNotification('Please select slots for all exams.', NotificationType.WARNING);
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
                {...this.formValues},
                {...this.selectedTimeSlot},
                {...(this.appointment$$.value ?? ({} as Appointment))},
                this.isCombinable
            );

            console.log(requestData);

            if (this.edit) {
                this.appointmentApiSvc
                    .updateAppointment$(requestData)
                    .pipe(takeUntil(this.destroy$$))
                    .subscribe({
                        next: () => {
                            this.shareDataService.getLanguage$().subscribe((language: string) => {
                                this.notificationSvc.showNotification(language === ENG_BE ? `Appointment updated successfully` : 'Afspraak succesvol geupdated');
                            });
                            this.submitting$$.next(false);

                            let route: string;
                            console.log('this.comingFromRoute: ', this.comingFromRoute);
                            if (this.comingFromRoute === 'view') {
                                route = '../view';
                            } else {
                                route = this.edit ? '/appointment' : '/dashboard';
                            }
                            this.router.navigate([route], {relativeTo: this.route});
                        },
                        error: (err) => {
                            this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
                            this.submitting$$.next(false);
                        },
                    });
            } else {
                this.appointmentApiSvc
                    .saveAppointment$(requestData)
                    .pipe(takeUntil(this.destroy$$))
                    .subscribe({
                        next: () => {
                            this.shareDataService.getLanguage$().subscribe((language: string) => {
                                this.notificationSvc.showNotification(language === ENG_BE ? `Appointment saved successfully` : 'Afspraak succesvol opgeslagen');
                            });
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
                            this.router.navigate([route], {relativeTo: this.route});
                        },
                        error: (err) => {
                            this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
                            this.submitting$$.next(false);
                        },
                    });
            }
        } catch (e) {
            console.log(e);
            this.notificationSvc.showNotification('Failed to save the appointment', NotificationType.DANGER);
            this.submitting$$.next(false);
            return;
        }
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

    public clearSlotDetails() {
        this.examIdToAppointmentSlots = {};
        this.selectedTimeSlot = {};
        this.slots = [];
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

    public close() {
        this.dialogSvc.close();
    }

    public resetForm() {
        this.appointmentForm.reset();
    }

    public submitSearch() {
        const data = this.appointmentForm.value;
        if (data.patientId) {
            let abc = data.patientId.split(':');
            data['FirstName'] = abc[0]
            data['LastName'] = abc[1]
        }
        if (data?.startedAt) data['startedAt'] = `${data?.startedAt?.year}-${data?.startedAt?.month}-${data?.startedAt?.day} ${data?.startTime}:00`;
        else data['startedAt'] = '';
        if (data?.endedAt) data['endedAt'] = `${data?.endedAt?.year}-${data?.endedAt?.month}-${data?.endedAt?.day} ${data?.endTime}:00`;
        else data['endedAt'] = '';
        this.dialogSvc.close(data);
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
        });
    }

    private updateForm(appointment: Appointment | undefined) {
        console.log(appointment);
        let date!: Date;
        let dateDistributed: DateDistributed = {} as DateDistributed;

        if (appointment?.startedAt) {
            date = new Date(appointment?.startedAt);
        } else if (appointment?.exams[0]?.startedAt) {
            date = new Date(appointment?.exams[0]?.startedAt);
        }

        dateDistributed = DateTimeUtils.DateToDateDistributed(date);

        console.log(dateDistributed);

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
            },
            {emitEvent: false},
        );

        const examList = appointment?.exams?.map((exam) => exam.id) ?? [];

        this.loadingSlots$$.next(true);
    }
}
