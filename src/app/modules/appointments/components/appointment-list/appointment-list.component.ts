import { TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ColumnSort, DfmDatasource, DfmTableHeader, NotificationType, TableItem } from 'diflexmo-angular-design';
import { BehaviorSubject, debounceTime, filter, map, Subject, switchMap, take, takeUntil, withLatestFrom } from 'rxjs';
import { PermissionService } from 'src/app/core/services/permission.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { PaginationData } from 'src/app/shared/models/base-response.model';
import { Permission } from 'src/app/shared/models/permission.model';
import { JoinWithAndPipe } from 'src/app/shared/pipes/join-with-and.pipe';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';
import { SignalrService } from 'src/app/core/services/signalr.service';
import { AppointmentAdvanceSearchComponent } from 'src/app/modules/dashboard/components/dashboard-appointments-list/appointment-advance-search/appointment-advance-search.component';
import { DocumentViewModalComponent } from 'src/app/shared/components/document-view-modal/document-view-modal.component';
import { SiteManagementApiService } from 'src/app/core/services/site-management-api.service';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { DownloadAsType, DownloadService } from '../../../../core/services/download.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { Appointment } from '../../../../shared/models/appointment.model';
import { Exam } from '../../../../shared/models/exam.model';
import { AppointmentStatus, AppointmentStatusToName, ChangeStatusRequestData } from '../../../../shared/models/status.model';
import { Translate } from '../../../../shared/models/translate.model';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { getAppointmentStatusEnum, getReadStatusEnum } from '../../../../shared/utils/getEnums';

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
		{ id: '1', title: 'StartedAt', isSortable: true, sort: 'Asc' },
		{ id: '2', title: 'EndedAt' },
		{ id: '3', title: 'PatientName' },
		{ id: '4', title: 'Exam' },
		{ id: '5', title: 'Physician' },
		{ id: '6', title: 'ReferralNote' },
		{ id: '7', title: 'AppointmentNo' },
		{ id: '8', title: 'AppliedOn' },
		{ id: '9', title: 'Status' },
	];

	public pastTableHeaders: DfmTableHeader[] = [...this.tableHeaders];

	public downloadItems: NameValue[] = [];

	private appointments$$: BehaviorSubject<Appointment[]>;

	public filteredAppointments$$: BehaviorSubject<Appointment[]>;

	private filteredPastAppointments$$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

	private pastAppointments$$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

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

	private pastPaginationData: PaginationData | undefined;

	public appointmentViewControl = new FormControl();

	public appointmentListData: NameValue[] = [];

	public isUpcomingAppointments: boolean = true;

	public isResetBtnDisable: boolean = true;

	private fileSize!: number;

	private sortType: undefined | ColumnSort = 'Asc';

	private sortTypePast: undefined | ColumnSort = 'Desc';

	public isLoading: boolean = true;

	private advanceSearchData: any;

	private qrCodeId!: string;

	private fileMaxCount!: number;

	private notAllowedExtentions: string[] = [];

	constructor(
		private downloadSvc: DownloadService,
		private appointmentApiSvc: AppointmentApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private route: ActivatedRoute,
		private modalSvc: ModalService,
		private roomApiSvc: RoomsApiService,
		private cdr: ChangeDetectorRef,
		private titleCasePipe: TitleCasePipe,
		private shareDataSvc: ShareDataService,
		private translate: TranslateService,
		public permissionSvc: PermissionService,
		private joinWithAndPipe: JoinWithAndPipe,
		private translatePipe: TranslatePipe,
		private signalRSvc: SignalrService,
		private siteManagementApiSvc: SiteManagementApiService,
	) {
		super();
		this.appointments$$ = new BehaviorSubject<any[]>([]);
		this.filteredAppointments$$ = new BehaviorSubject<any[]>([]);
		this.appointmentApiSvc.appointmentPageNo = 1;
		this.pastTableHeaders[0] = { id: '1', title: 'StartedAt', isSortable: true, sort: 'Desc' };
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
			this.fileMaxCount = siteSettings.docUploadMaxCount;
		});

		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

		this.filteredAppointments$$
			.pipe(
				takeUntil(this.destroy$$),
				map((appointments) => GeneralUtils.SortArray(appointments, this.sortType, 'startedAt')),
			)
			.subscribe({
				next: (items) => {
					this.upcomingTableData$$.next({
						items: [...items],
						isInitialLoading: false,
						isLoading: false,
						isLoadingMore: false,
					});
				},
			});

		this.filteredPastAppointments$$
			.pipe(
				takeUntil(this.destroy$$),
				map((appointments) => GeneralUtils.SortArray(appointments, this.sortTypePast, 'startedAt')),
			)
			.subscribe({
				next: (items) => {
					this.pastTableData$$.next({
						items: [...items],
						isInitialLoading: false,
						isLoading: false,
						isLoadingMore: false,
					});
				},
			});

		this.appointments$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: () => this.handleSearch(this.searchControl.value ?? ''),
		});

		this.pastAppointments$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (appointments) => this.filteredPastAppointments$$.next([...appointments]),
		});

		this.appointmentApiSvc.appointment$.pipe(takeUntil(this.destroy$$)).subscribe({
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

		this.appointmentApiSvc.pastAppointment$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (appointmentsBase) => {
				if (this.pastPaginationData && this.pastPaginationData.pageNo < appointmentsBase?.metaData?.pagination.pageNo) {
					this.pastAppointments$$.next([...this.pastAppointments$$.value, ...appointmentsBase.data]);
				} else {
					this.pastAppointments$$.next(appointmentsBase.data);
				}
				this.pastPaginationData = appointmentsBase?.metaData?.pagination || 1;
				this.isLoading = false;
			},
			error: () => this.filteredPastAppointments$$.next([]),
		});

		this.route.queryParams.pipe(takeUntil(this.destroy$$)).subscribe(({ search }) => {
			this.searchControl.setValue(search);
			if (search) {
				this.handleSearch(search.toLowerCase());
			} else {
				this.filteredAppointments$$.next([...this.appointments$$.value]);
				this.filteredPastAppointments$$.next([...this.pastAppointments$$.value]);
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
						this.appointmentApiSvc.convertUtcToLocalDate(ap?.startedAt),
						this.appointmentApiSvc.convertUtcToLocalDate(ap?.endedAt),
						`${this.titleCasePipe.transform(ap?.patientFname)} ${this.titleCasePipe.transform(ap?.patientLname)}`,
						this.joinWithAndPipe.transform(ap.exams, 'name'),
						this.titleCasePipe.transform(ap?.doctor) ?? '-',
						ap.documentCount ? 'Yes' : 'No',
						ap?.id?.toString(),
						this.appointmentApiSvc.convertUtcToLocalDate(ap?.createdAt),
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
				this.isUpcomingAppointments = value === 'upcoming';
				this.searchControl.setValue('');
				this.onRefresh();
			}
			this.selectedAppointmentIDs = [];
			this.filteredAppointments$$.next([...this.appointments$$.value]);
		});
		setTimeout(() => {
			this.appointmentViewControl.setValue(this.isUpcomingAppointments ? 'upcoming' : 'past');
		}, 0);
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public handleCheckboxSelection(selected: string[]) {
		this.selectedAppointmentIDs = [...selected];
	}

	private handleSearch(searchText: string): void {
		if (this.isUpcomingAppointments) {
			this.filteredAppointments$$.next([
				...this.appointments$$.value.filter((appointment) => {
					const status: any = this.getStatusInstance(appointment);
					return this.getSearchFilteredData(appointment, searchText, status);
				}),
			]);
		} else {
			this.filteredPastAppointments$$.next([
				...this.pastAppointments$$.value.filter((appointment) => {
					const status: any = this.getStatusInstance(appointment);
					return this.getSearchFilteredData(appointment, searchText, status);
				}),
			]);
		}
	}

	private getStatusInstance(appointment: Appointment): string {
		let status: any;
		if (appointment.approval === 0) status = this.translate.instant('Pending');
		if (appointment.approval === 1) status = this.translate.instant('Approved');
		if (appointment.approval === 2) status = this.translate.instant('Canceled');
		return status;
	}

	private getSearchFilteredData(appointment: Appointment, searchText: string, status: string): boolean {
		return (
			`${appointment.patientFname?.toLowerCase()} ${appointment.patientLname?.toLowerCase()}`?.includes(searchText) ||
			appointment.patientLname?.toLowerCase()?.includes(searchText) ||
			appointment.doctor?.toLowerCase()?.includes(searchText) ||
			appointment.id?.toString()?.includes(searchText) ||
			status?.toLowerCase()?.startsWith(searchText)
		);
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
			let dataString = `${this.tableHeaders
				.map(({ title }) => title)
				.filter((value) => value !== 'Actions')
				.join('\t\t')}\n`;

			const data: any[] = this.isUpcomingAppointments ? this.upcomingTableData$$.value.items : this.pastTableData$$.value.items;

			if (!data.length) {
				this.notificationSvc.showNotification(Translate.NoDataToCopy[this.selectedLang], NotificationType.DANGER);
				this.clipboardData = '';
				return;
			}

			data.forEach((ap: Appointment) => {
				dataString += `${this.appointmentApiSvc.convertUtcToLocalDate(ap.startedAt)}\t\t${this.appointmentApiSvc.convertUtcToLocalDate(
					ap.endedAt,
				)}\t\t${this.titleCasePipe.transform(ap.patientFname)} ${this.titleCasePipe.transform(ap.patientLname)}\t\t${this.joinWithAndPipe.transform(
					ap.exams,
					'name',
				)}\t\t${this.titleCasePipe.transform(ap.doctor) || '-'}\t\t${
					ap.documentCount ? 'Yes' : 'No'
				}\t\t${ap.id.toString()}\t\t${this.appointmentApiSvc.convertUtcToLocalDate(ap.createdAt)}\t\t${ap.readStatus ? 'Yes' : 'No'}\t\t${
					AppointmentStatusToName[+ap.approval]
				}\n`;
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

	private clearDownloadDropdown() {
		setTimeout(() => {
			this.downloadDropdownControl.setValue('');
		}, 0);
	}

	public onRefresh(): void {
		this.appointmentApiSvc.refresh();
		this.advanceSearchData = undefined;
		this.isResetBtnDisable = true;
		this.appointmentApiSvc.appointmentPageNo = 1;
		this.appointmentApiSvc.pastAppointmentPageNo = 1;
	}

	public onScroll(): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.appointmentApiSvc.appointmentPageNo += 1;
			this.upcomingTableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader, table = 'upcoming'): void {
		if (table === 'past') {
			this.sortTypePast = e.sort;
			this.filteredPastAppointments$$.next(GeneralUtils.SortArray(this.filteredPastAppointments$$.value, e.sort, ColumnIdToKey[e.id]));
		} else {
			this.sortType = e.sort;
			this.filteredAppointments$$.next(GeneralUtils.SortArray(this.filteredAppointments$$.value, e.sort, ColumnIdToKey[e.id]));
		}
	}

	openAdvancePopup() {
		const modalRef = this.modalSvc.open(AppointmentAdvanceSearchComponent, {
			data: {
				titleText: 'AdvancedSearch',
				confirmButtonText: 'Search',
				cancelButtonText: 'Reset',
				values: this.advanceSearchData,
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
				switchMap((result) => {
					this.advanceSearchData = result;
					return this.appointmentApiSvc.fetchAllAppointments$(1, !this.isUpcomingAppointments, result);
				}),
				take(1),
			)
			.subscribe({
				next: (appointments) => {
					if (this.isUpcomingAppointments) {
						this.appointments$$.next(appointments?.data);
						this.filteredAppointments$$.next(appointments?.data);
					} else {
						this.pastAppointments$$.next(appointments?.data);
						this.filteredPastAppointments$$.next(appointments?.data);
					}
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
		if (!event.target.files.length) {
			return;
		}
		this.fileChange(event, id);
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

	private fileChange(event: any, appointmentId: any) {
		const e = event;
		const { files } = event.target as HTMLInputElement;

		if (files?.length) {
			const promises = Array.from(files).map((file) => this.readFileAsDataURL(file));
			Promise.all(promises).then((transformedDataArray) => {
				this.uploadDocuments(transformedDataArray, appointmentId);
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

	private async uploadDocuments(transformedDataArray: string[], appointmentId) {
		let isLimitExceeded = false;
		if (transformedDataArray?.length > this.fileMaxCount) {
			transformedDataArray.splice(this.fileMaxCount);
			isLimitExceeded = true;
		}
		this.notAllowedExtentions = [];

		for (const [index, file] of transformedDataArray.entries()) {
			if (!this.qrCodeId) {
				await this.uploadDocument(file, appointmentId, index === transformedDataArray?.length - 1, isLimitExceeded);
			} else {
				this.uploadDocument(file, appointmentId, index === transformedDataArray?.length - 1, isLimitExceeded, this.qrCodeId);
			}
		}
	}

	private uploadDocument(file: any, appointmentId: any, isLast: boolean, isLimitExceeded: boolean, uniqueId = '') {
		const fileSizeExceedsLimit = file.size / 1024 / 1024 > this.fileSize;
		if (this.checkFileExtensions(file)) {
			this.notAllowedExtentions.push(file.name.split('.').pop().toLowerCase());
			return;
		}

		return new Promise((resolve) => {
			this.appointmentApiSvc
				.uploadDocumnet(file, uniqueId, `${appointmentId}`)
				.pipe(take(1))
				.subscribe({
					next: (documentList) => {
						this.notificationSvc.showNotification(Translate.AddedSuccess(file?.name)[this.selectedLang], NotificationType.SUCCESS);
						if (isLast) {
							setTimeout(() => {
								this.generateDocErrors(isLimitExceeded, fileSizeExceedsLimit);
							}, 200);
							this.onRefresh();
						}
						resolve(documentList);
					},
					error: (err) => {
						this.notificationSvc.showNotification(Translate.Error.FailedToUpload[this.selectedLang], NotificationType.DANGER);
						resolve(err);
					},
				});
		});
	}

	private generateDocErrors(isLimitExceeded: boolean, fileSizeExceedsLimit: boolean) {
		if (isLimitExceeded) {
			this.notificationSvc.showNotification(Translate.Error.UploadLimitExceeded[this.selectedLang], NotificationType.DANGER);
		}
		if (fileSizeExceedsLimit) {
			this.notificationSvc.showNotification(`${Translate.FileNotGreaterThan[this.selectedLang]}  ${this.fileSize}MB`, NotificationType.DANGER);
		}
		if (this.notAllowedExtentions.length) {
			this.notificationSvc.showNotification(
				`${Translate.FileFormatNotAllowed[this.selectedLang]} (${[...new Set(this.notAllowedExtentions)].join(', ')})`,
				NotificationType.DANGER,
			);
		}
	}
}
