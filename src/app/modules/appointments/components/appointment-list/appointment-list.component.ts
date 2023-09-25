import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ColumnSort, DfmDatasource, DfmTableHeader, NotificationType, TableItem } from 'diflexmo-angular-design';
import { BehaviorSubject, combineLatest, debounceTime, filter, map, Subject, switchMap, take, takeUntil, withLatestFrom } from 'rxjs';
import { PermissionService } from 'src/app/core/services/permission.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { PaginationData } from 'src/app/shared/models/base-response.model';
import { Permission } from 'src/app/shared/models/permission.model';
import { JoinWithAndPipe } from 'src/app/shared/pipes/join-with-and.pipe';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { DownloadAsType, DownloadService } from '../../../../core/services/download.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NameValue, SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { Appointment } from '../../../../shared/models/appointment.model';
import { getDurationMinutes } from '../../../../shared/models/calendar.model';
import { Exam } from '../../../../shared/models/exam.model';
import { AppointmentStatus, AppointmentStatusToName, ChangeStatusRequestData } from '../../../../shared/models/status.model';
import { Translate } from '../../../../shared/models/translate.model';
import { DefaultDatePipe } from '../../../../shared/pipes/default-date.pipe';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { getAppointmentStatusEnum, getReadStatusEnum } from '../../../../shared/utils/getEnums';
import { SignalrService } from 'src/app/core/services/signalr.service';
import { AppointmentAdvanceSearchComponent } from 'src/app/modules/dashboard/components/dashboard-appointments-list/appointment-advance-search/appointment-advance-search.component';
import { DocumentViewModalComponent } from 'src/app/shared/components/document-view-modal/document-view-modal.component';
import { SiteManagementApiService } from 'src/app/core/services/site-management-api.service';

const ColumnIdToKey = {
	1: 'startedAt',
	2: 'endedAt',
	3: 'patientFname',
	4: 'exams',
	5: 'doctor',
	6: 'referralNote',
	7: 'id',
	8: 'createdAt',
	9: 'approval',
};

@Component({
	selector: 'dfm-appointment-list',
	templateUrl: './appointment-list.component.html',
	styleUrls: ['./appointment-list.component.scss'],
})
export class AppointmentListComponent extends DestroyableComponent implements OnInit, OnDestroy {
	@HostListener('document:click', ['$event']) onClick() {
		this.toggleMenu(true);
	}

	public searchControl = new FormControl('', []);

	public downloadDropdownControl = new FormControl('', []);

	public columns: string[] = [
		'StartedAt',
		'EndedAt',
		'PatientName',
		'Exam',
		'Physician',
		'ReferralNote',
		'AppointmentNo',
		'AppliedOn',
		'Status',
		'Actions',
	];

	public tableHeaders: DfmTableHeader[] = [
		{ id: '1', title: 'StartedAt', isSortable: true, sort : 'Asc' },
		{ id: '2', title: 'EndedAt'},
		{ id: '3', title: 'PatientName'},
		{ id: '4', title: 'Exam'},
		{ id: '5', title: 'Physician'},
		{ id: '6', title: 'ReferralNote'},
		{ id: '7', title: 'AppointmentNo'},
		{ id: '8', title: 'AppliedOn'},
		{ id: '9', title: 'Status'},
	];

	public pastTableHeaders: DfmTableHeader[] = [...this.tableHeaders];

	public downloadItems: NameValue[] = [];

	public appointments$$: BehaviorSubject<Appointment[]>;

	public filteredAppointments$$: BehaviorSubject<Appointment[]>;

	public upcomingTableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public pastTableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public appointmentsGroupedByDate: { [key: string]: Appointment[] } = {};

	public appointmentsGroupedByDateAndTime: { [keydeployed: string]: Appointment[][] } = {};

	private selectedLang: string = ENG_BE;

	public statuses = Statuses;

	public readonly Permission = Permission;

	public appointmentGroupedByDateAndRoom: {
		[key: string]: {
			[key: number]: {
				appointment: Appointment;
				exams: Exam[];
			}[];
		};
	} = {};

	public clearSelected$$ = new Subject<void>();

	public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: AppointmentStatus | null } | null>(null);

	public calendarView$$ = new BehaviorSubject<boolean>(false);

	public selectedAppointmentIDs: string[] = [];

	public roomList: NameValue[] = [];

	public statusType = getAppointmentStatusEnum();

	public readStatus = getReadStatusEnum();

	public clipboardData: string = '';

	private paginationData: PaginationData | undefined;

	public appointmentViewControl = new FormControl();

	public appointmentListData: NameValue[] = [];

	public isUpcomingAppointments: boolean = true;

	public isResetBtnDisable: boolean = true;

	private fileSize!: number;

	private sortType: undefined | ColumnSort = 'Asc'

	private sortTypePast: undefined | ColumnSort = 'Asc'

	public isLoading: boolean = true;
	
	constructor(
		private downloadSvc: DownloadService,
		private appointmentApiSvc: AppointmentApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private route: ActivatedRoute,
		private modalSvc: ModalService,
		private roomApiSvc: RoomsApiService,
		private datePipe: DatePipe,
		private cdr: ChangeDetectorRef,
		private titleCasePipe: TitleCasePipe,
		private routerStateSvc: RouterStateService,
		private shareDataSvc: ShareDataService,
		private translate: TranslateService,
		public permissionSvc: PermissionService,
		private defaultDatePipe: DefaultDatePipe,
		private utcToLocalPipe: UtcToLocalPipe,
		private joinWithAndPipe: JoinWithAndPipe,
		private translatePipe: TranslatePipe,
		private signalRSvc: SignalrService,
		private siteManagementApiSvc: SiteManagementApiService,
	) {
		super();
		this.appointments$$ = new BehaviorSubject<any[]>([]);
		this.filteredAppointments$$ = new BehaviorSubject<any[]>([]);
		this.appointmentApiSvc.appointmentPageNo = 1;
		localStorage.removeItem('previousPagefromView');

		this.route.queryParams.pipe(takeUntil(this.destroy$$)).subscribe((params) => {
			if (params['v']) {
				this.calendarView$$.next(params['v'] !== 't');
			} else {
				this.router.navigate([], {
					replaceUrl: true,
					queryParams: {
						v: 'w',
					},
					queryParamsHandling: 'merge',
				});
				this.calendarView$$.next(true);
			}
		});

		this.permissionSvc.permissionType$.pipe(takeUntil(this.destroy$$)).subscribe(() => {
			if (
				this.permissionSvc.isPermitted([Permission.UpdateAppointments, Permission.DeleteAppointments]) &&
				!this.tableHeaders.find(({ title }) => title === 'Actions' || title === 'Acties')
			) {
				this.tableHeaders = [
					...this.tableHeaders,
					{ id: this.tableHeaders?.length?.toString(), title: 'Actions', isSortable: false, isAction: true },
				];
			}
		});
		this.appointmentApiSvc.appointmentListData$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				this.appointmentListData = items;
			},
		});
	}

	public ngOnInit() {
		this.siteManagementApiSvc.siteManagementData$.pipe(takeUntil(this.destroy$$)).subscribe((siteSettings) => {
			this.fileSize = siteSettings.documentSizeInKb / 1024;
		});

		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

		this.filteredAppointments$$
			.pipe(
				takeUntil(this.destroy$$),
				map((appointments) => (GeneralUtils.SortArray(appointments, this.isUpcomingAppointments ?this.sortType : this.sortTypePast, 'startedAt'))),
				map((data) => [data.filter((item) => item.isEditable), data.filter((item) => !item.isEditable)]),
			)
			.subscribe({
				next: (items) => {
					this.upcomingTableData$$.next({
						items: items[0],
						isInitialLoading: false,
						isLoading: false,
						isLoadingMore: false,
					});
					this.pastTableData$$.next({
						items: items[1],
						isInitialLoading: false,
						isLoading: false,
						isLoadingMore: false,
					});
				},
			});

		this.appointments$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (appointment) => this.handleSearch(this.searchControl.value ?? ''),
		});

		this.appointmentApiSvc.appointment$
			.pipe(
				takeUntil(this.destroy$$),
				// map((appointmentsBase) => ({ data: GeneralUtils.SortArray(appointmentsBase.data, 'Asc', 'startedAt'), metaData: appointmentsBase.metaData })),
			)
			.subscribe({
				next: (appointmentsBase) => {
					if (this.paginationData && this.paginationData.pageNo < appointmentsBase?.metaData?.pagination.pageNo) {
						this.appointments$$.next([...this.appointments$$.value, ...appointmentsBase.data]);
					} else {
						this.appointments$$.next(appointmentsBase.data);
					}
					this.paginationData = appointmentsBase?.metaData?.pagination || 1;
					this.isLoading = false;
				},
				error: () => this.filteredAppointments$$.next([]),
			});

		this.route.queryParams.pipe(takeUntil(this.destroy$$)).subscribe(({ search }) => {
			this.searchControl.setValue(search);
			if (search) {
				this.handleSearch(search.toLowerCase());
			} else {
				this.filteredAppointments$$.next([...this.appointments$$.value]);
			}
		});

		this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe({
			next: (searchText) => {
				this.router.navigate([], { queryParams: { search: searchText }, relativeTo: this.route, queryParamsHandling: 'merge', replaceUrl: true });
			},
		});

		this.downloadDropdownControl.valueChanges
			.pipe(
				filter((value) => !!value),
				takeUntil(this.destroy$$),
			)
			.subscribe((value) => {
				const data: any[] = this.isUpcomingAppointments ? this.upcomingTableData$$.value.items : this.pastTableData$$.value.items;
				
				if (!data.length) {
					this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
					this.clearDownloadDropdown();
					return;
				}

				this.downloadSvc.downloadJsonAs(
					value as DownloadAsType,
					this.tableHeaders.map(({ title }) => title).filter((val) => val !== 'Actions'),
					data?.map((ap: Appointment) => [
						this.defaultDatePipe.transform(this.utcToLocalPipe.transform(ap?.startedAt?.toString())) ?? '',
						this.defaultDatePipe.transform(this.utcToLocalPipe.transform(ap?.endedAt?.toString())) ?? '',
						`${this.titleCasePipe.transform(ap?.patientFname)} ${this.titleCasePipe.transform(ap?.patientLname)}`,
						this.joinWithAndPipe.transform(ap.exams, 'name'),
						this.titleCasePipe.transform(ap?.doctor),
						ap?.id?.toString(),
						ap?.createdAt?.toString(),
						// ap.readStatus ? 'Yes' : 'No',
						this.translatePipe.transform(AppointmentStatusToName[+ap.approval]),
					]),
					'appointment',
				);

				if (value !== 'PRINT') {
					this.notificationSvc.showNotification(`${Translate.DownloadSuccess(value)[this.selectedLang]}`);
				}
				this.clearDownloadDropdown();
			});

		this.afterBannerClosed$$
			.pipe(
				map((value) => {
					if (value?.proceed) {
						return [...this.selectedAppointmentIDs.map((id) => ({ id: +id, status: value.newStatus as number }))];
					}
					return [];
				}),
				filter((changes) => {
					if (!changes.length) {
						this.clearSelected$$.next();
					}
					return !!changes.length;
				}),
				switchMap((changes) => this.appointmentApiSvc.changeAppointmentStatus$(changes)),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: () => {
					this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
					this.clearSelected$$.next();
				},
			});

		this.roomApiSvc.allRooms$.pipe(takeUntil(this.destroy$$)).subscribe((rooms) => {
			this.roomList = rooms?.map(({ name, id }) => ({ name, value: id }));
		});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => {
				this.selectedLang = lang;
				this.tableHeaders = this.tableHeaders.map((h, i) => ({
					...h,
					title: Translate[this.columns[i]][lang],
				}));
				this.pastTableHeaders = this.pastTableHeaders.map((h, i) => ({
					...h,
					title: Translate[this.columns[i]][lang],
				}));
				// eslint-disable-next-line default-case
				switch (lang) {
					case ENG_BE:
						this.statuses = Statuses;
						break;
					case DUTCH_BE:
						this.statuses = StatusesNL;
						break;
				}
			});

		this.signalRSvc.latestAppointmentInfo$.pipe(withLatestFrom(this.appointments$$), takeUntil(this.destroy$$)).subscribe({
			next: ([item, list]) => {
				const modifiedList = GeneralUtils.modifyListData(list, item[0], item[0].action.toLowerCase(), 'id');
				this.appointments$$.next(modifiedList);
			},
		});

		this.appointmentViewControl.valueChanges.pipe(takeUntil(this.destroy$$)).subscribe((value) => {
			if (value) {
				this.isUpcomingAppointments = value == 'upcoming';
			}
			this.selectedAppointmentIDs = [];
			this.filteredAppointments$$.next([...this.appointments$$.value])
		});
		setTimeout(() => {
			this.appointmentViewControl.setValue(this.isUpcomingAppointments ? 'upcoming' : 'past');
		}, 0);
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	// public manageActionColumn([...data]): Array<any> {
	// 	if (data.find(({ title }) => title === 'Actions' || title === 'Acties')) {
	// 		data.pop();
	// 	}
	// 	return data;
	// }

	public handleCheckboxSelection(selected: string[]) {
		this.selectedAppointmentIDs = [...selected];
	}

	private handleSearch(searchText: string): void {
		this.filteredAppointments$$.next([
			...this.appointments$$.value.filter((appointment) => {
				let status: any;
				if (appointment.approval === 0) status = this.translate.instant('Pending');
				if (appointment.approval === 1) status = this.translate.instant('Approved');
				if (appointment.approval === 2) status = this.translate.instant('Canceled');
				return (
					(appointment.patientFname?.toLowerCase() + ' ' + appointment.patientLname?.toLowerCase())?.includes(searchText) ||
					appointment.doctor?.toLowerCase()?.includes(searchText) ||
					appointment.id?.toString()?.includes(searchText) ||
					status?.toLowerCase()?.startsWith(searchText)
				);
			}),
		]);
	}

	public changeStatus(changes: ChangeStatusRequestData[]) {
		this.appointmentApiSvc
			.changeAppointmentStatus$(changes)
			.pipe(takeUntil(this.destroy$$))
			.subscribe(() => this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]));
	}

	public deleteAppointment(id: number) {
		const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreYouSureYouWantToDeleteAppointment',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		dialogRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.appointmentApiSvc.deleteAppointment$(id)),
				take(1),
			)
			.subscribe(() => {
				this.notificationSvc.showNotification(Translate.DeleteAppointment[this.selectedLang]);
			});
	}

	public handleConfirmation(e: { proceed: boolean; newStatus: AppointmentStatus | null }) {
		this.afterBannerClosed$$.next(e);
	}

	public copyToClipboard() {
		try {
			let dataString = `Started At\t\t\tEnded At\t\t\t`;
			dataString += `${this.tableHeaders
				.map(({ title }) => title)
				.filter((value) => value !== 'Actions')
				.join('\t\t')}\n`;

			if (!this.filteredAppointments$$.value.length) {
				this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.DANGER);
				this.clipboardData = '';
				return;
			}

			this.filteredAppointments$$.value.forEach((ap: Appointment) => {
				dataString += `${ap.startedAt.toString()}\t${ap.endedAt.toString()}\t${this.titleCasePipe.transform(
					ap.patientFname,
				)} ${this.titleCasePipe.transform(ap.patientLname)}\t\t${this.titleCasePipe.transform(
					ap.doctor,
				)}\t\t${ap.id.toString()}\t\t${ap.createdAt.toString()}\t\t${ap.readStatus ? 'Yes' : 'No'}\t\t${AppointmentStatusToName[+ap.approval]}\n`;
			});

			this.clipboardData = dataString;

			this.cdr.detectChanges();
			this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
		} catch (e) {
			this.notificationSvc.showNotification(Translate.ErrorMessage.FailedToCopyData[this.selectedLang], NotificationType.DANGER);
			this.clipboardData = '';
		}
	}

	public navigateToView(e: TableItem) {
		if (e?.id) {
			localStorage.setItem('previousPagefromView', 'appointment');
			this.router.navigate([`./${e.id}/view`], { replaceUrl: true, relativeTo: this.route, queryParamsHandling: 'merge' });
		}
	}

	public toggleMenu(reset = false) {
		const icon = document.querySelector('.sf-li-plus-btn-icon');
		if (icon) {
			if (reset) {
				icon.classList.add('rotate-z-0');
				icon.classList.remove('rotate-z-45');
			} else {
				icon.classList.toggle('rotate-z-45');
				icon.classList.toggle('rotate-z-0');
			}
		}
	}

	public openSearchModal() {
		this.toggleMenu();

		const modalRef = this.modalSvc.open(SearchModalComponent, {
			options: { fullscreen: true },
			data: {
				items: [
					...this.appointments$$.value.map(({ id, patientLname, patientFname }) => {
						return {
							name: `${patientFname} ${patientLname}`,
							key: `${patientFname} ${patientLname} ${id}`,
							value: id,
						};
					}),
				],
				placeHolder: 'Search by Patient Name, app. no...',
			} as SearchModalData,
		});

		modalRef.closed.pipe(take(1)).subscribe((result) => this.filterAppointments(result));
	}

	private filterAppointments(result: { name: string; value: string }[]) {
		if (!result?.length) {
			this.filteredAppointments$$.next([...this.appointments$$.value]);
			return;
		}

		const ids = new Set<number>();
		result.forEach((item) => ids.add(+item.value));
		this.filteredAppointments$$.next([...this.appointments$$.value.filter((appointment: Appointment) => ids.has(+appointment.id))]);
	}

	public toggleView(): void {
		this.selectedAppointmentIDs = [];
		this.router.navigate([], {
			replaceUrl: true,
			queryParams: {
				v: !this.calendarView$$.value ? 'w' : 't',
			},
			queryParamsHandling: 'merge',
		});
		setTimeout(() => {
			this.appointmentViewControl.setValue(this.isUpcomingAppointments ? 'upcoming' : 'past');
		}, 0);
	}

	private groupAppointmentsForCalendar(...appointments: Appointment[]) {
		let startDate: Date;
		let endDate: Date;
		// let group: number;
		let sameGroup: boolean;
		let groupedAppointments: Appointment[] = [];
		let lastDateString: string;

		this.appointmentsGroupedByDate = {};
		this.appointmentsGroupedByDateAndTime = {};
		this.appointmentGroupedByDateAndRoom = {};

		appointments.push({} as Appointment);
		appointments.forEach((appointment, index) => {
			if (Object.keys(appointment).length && appointment.exams?.length && appointment.startedAt) {
				const dateString = this.datePipe.transform(new Date(appointment.startedAt), 'd-M-yyyy');

				if (dateString) {
					if (!this.appointmentsGroupedByDate[dateString]) {
						this.appointmentsGroupedByDate[dateString] = [];
					}

					if (!this.appointmentsGroupedByDateAndTime[dateString]) {
						this.appointmentsGroupedByDateAndTime[dateString] = [];

						startDate = new Date(appointment.startedAt);
						endDate = new Date(appointment.endedAt);
						// group = 0;
						sameGroup = false;
					} else {
						const currSD = new Date(appointment.startedAt);
						const currED = new Date(appointment.endedAt);

						if (currSD.getTime() === startDate.getTime() || (currSD > startDate && currSD < endDate) || currSD.getTime() === endDate.getTime()) {
							sameGroup = true;
							if (currED > endDate) {
								endDate = currED;
							}
						} else if (currSD > endDate && getDurationMinutes(endDate, currSD) <= 1) {
							sameGroup = true;
							if (currED > endDate) {
								endDate = currED;
							}
						} else {
							startDate = currSD;
							endDate = currED;
							sameGroup = false;
						}
					}

					if (!sameGroup) {
						// group++;

						if (index !== 0) {
							this.appointmentsGroupedByDateAndTime[lastDateString].push(groupedAppointments);
							groupedAppointments = [];
						}
					}

					lastDateString = dateString;

					groupedAppointments.push(appointment);
					this.appointmentsGroupedByDate[dateString].push(appointment);
				}
			} else if (lastDateString) {
				this.appointmentsGroupedByDateAndTime[lastDateString].push(groupedAppointments);
			}
		});
	}

	private groupAppointmentByDateAndRoom(...appointments: Appointment[]) {
		// const groupBy: {
		//   [key: string]: {
		//     [key: number]: {
		//       appointment: Appointment;
		//       exam: Exam[];
		//     };
		//   };
		// } = {};

		appointments.forEach((appointment) => {
			const dateString = this.datePipe.transform(new Date(appointment.startedAt), 'd-M-yyyy');

			if (dateString) {
				if (!this.appointmentGroupedByDateAndRoom[dateString]) {
					this.appointmentGroupedByDateAndRoom[dateString] = {};
				}

				appointment.exams?.forEach((exam) => {
					exam.rooms?.forEach((room) => {
						if (!this.appointmentGroupedByDateAndRoom[dateString][room.id]) {
							this.appointmentGroupedByDateAndRoom[dateString][room.id] = [];
						}

						this.appointmentGroupedByDateAndRoom[dateString][room.id].push({
							appointment,
							exams: appointment.exams ?? [],
						});
					});
				});
			}
		});
	}

	private clearDownloadDropdown() {
		setTimeout(() => {
			this.downloadDropdownControl.setValue('');
		}, 0);
	}

	public onRefresh(): void {
		this.appointmentApiSvc.refresh();
		this.isResetBtnDisable = true;
		this.appointmentApiSvc.appointmentPageNo = 1;
	}

	public onScroll(e: any): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.appointmentApiSvc.appointmentPageNo = this.appointmentApiSvc.appointmentPageNo + 1;
			this.upcomingTableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader, table = 'upcoming'): void {
		table == 'past' ? this.sortTypePast = e.sort : this.sortType = e.sort
		this.filteredAppointments$$.next(GeneralUtils.SortArray(this.filteredAppointments$$.value, e.sort, ColumnIdToKey[e.id]));
	}

	openAdvancePopup() {
		const modalRef = this.modalSvc.open(AppointmentAdvanceSearchComponent, {
			data: {
				titleText: 'AdvancedSearch',
				confirmButtonText: 'Search',
				cancelButtonText: 'Reset',
				items: [
					...this.appointments$$.value.map(({ id, patientLname, patientFname }) => {
						return {
							name: `${patientFname} ${patientLname}`,
							key: `${patientFname} ${patientLname} ${id}`,
							value: id,
						};
					}),
				],
			},
			options: {
				size: 'xl',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
			},
		});

		modalRef.closed
			.pipe(
				filter((res) => !!res),
				switchMap((result) => this.appointmentApiSvc.fetchAllAppointments$(1, result)),
				take(1),
			)
			.subscribe({
				next: (appointments) => {
					this.appointments$$.next(appointments?.data);
					this.filteredAppointments$$.next(appointments?.data);
					this.isResetBtnDisable = false;
				},
			});
	}

	public openDocumentModal(id: number) {
		this.modalSvc.open(DocumentViewModalComponent, {
			data: {
				id,
			},
			options: {
				size: 'xl',
				backdrop: true,
				centered: true,
				modalDialogClass: 'ad-ap-modal-shadow',
			},
		});
	}

	public uploadRefferingNote(event: any, id: any) {
		event.stopImmediatePropagation();
		var extension = event.target.files[0].name.substr(event.target.files[0].name.lastIndexOf('.') + 1).toLowerCase();
		var allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
		const fileSize = event.target.files[0].size / 1024 / 1024 > this.fileSize;
		if (!event.target.files.length) {
			return;
		} else if (allowedExtensions.indexOf(extension) === -1) {
			this.notificationSvc.showNotification(Translate.FileFormatNotAllowed[this.selectedLang], NotificationType.WARNING);
		} else if (fileSize) {
			this.notificationSvc.showNotification(`${Translate.FileNotGreaterThan[this.selectedLang]} ${this.fileSize} MB.`, NotificationType.WARNING);
		} else {
			this.notificationSvc.showNotification(Translate.uploading[this.selectedLang], NotificationType.INFO);
			this.onFileChange(event, id);
		}
	}

	private onFileChange(event: any, id) {
		new Promise((resolve) => {
			const { files } = event.target as HTMLInputElement;

			if (files && files?.length) {
				const reader = new FileReader();
				reader.onload = (e: any) => {
					resolve(files[0]);
				};
				reader.readAsDataURL(files[0]);
			}
		}).then((res) => {
			this.uploadDocument(res, id);
			event.target.value = '';
		});
	}

	private uploadDocument(file: any, id) {
		this.appointmentApiSvc.uploadDocumnet(file, '', id).subscribe({
			next: (res) => {
				this.notificationSvc.showNotification(`${Translate.documentUploadSuccessfully[this.selectedLang]}`, NotificationType.SUCCESS);
				this.onRefresh();
			},
			error: (err) => this.notificationSvc.showNotification(`${Translate.Error.FailedToUpload[this.selectedLang]}`, NotificationType.DANGER),
		});
	}
}
