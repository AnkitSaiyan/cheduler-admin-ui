import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, filter, groupBy, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DownloadAsType, DownloadService } from 'src/app/core/services/download.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { RoomsApiService } from 'src/app/core/services/rooms-api.service';
import { RouterStateService } from 'src/app/core/services/router-state.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { NameValue } from 'src/app/shared/components/search-modal.component';
import { Appointment } from 'src/app/shared/models/appointment.model';
import { DfmDatasource, DfmTableHeader, NotificationType, TableItem } from 'diflexmo-angular-design';
import { Translate } from 'src/app/shared/models/translate.model';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from 'src/app/shared/utils/const';
import { PaginationData } from 'src/app/shared/models/base-response.model';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';

const ColumnIdToKey = {
	1: 'roomName',
	2: 'startDate',
	3: 'endDate',
	4: 'absenceName',
};

@Component({
	selector: 'dfm-unavailable-hall-periods',
	templateUrl: './unavailable-hall-periods.component.html',
	styleUrls: ['./unavailable-hall-periods.component.scss'],
})
export class UnavailableHallPeriodsComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public columns: string[] = ['RoomName', 'StartedAt', 'End', 'AbsenceTitle'];

	public tableHeaders: DfmTableHeader[] = [
		{ id: '1', title: 'RoomName', isSortable: true },
		{ id: '2', title: 'StartedAt', isSortable: true },
		{ id: '3', title: 'End', isSortable: true },
		{ id: '4', title: 'AbsenceTitle', isSortable: true },
	];

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	private roomAbsence$$: BehaviorSubject<any[]>;

	public filteredRoomAbsence$$: BehaviorSubject<any[]>;

	public searchControl = new FormControl('', []);

	public downloadDropdownControl = new FormControl('', []);

	private selectedLang: string = ENG_BE;

	public statuses = Statuses;

	private paginationData: PaginationData | undefined;

	// public downloadItems: NameValue[] = [];

	// public recentPatients: any = [
	//   {
	//     roomName: 'Maaike',
	//     absenceName: 'Hannibal Smith',
	//     end: new Date(),
	//     getStarted: new Date(),
	//   },
	//   {
	//     roomName: 'Maaike',
	//     absenceName: 'Bannie Smith',
	//     end: new Date(),
	//     getStarted: new Date(),
	//   },
	//   {
	//     roomName: 'Maaike',
	//     absenceName: 'Kate Smith',
	//     end: new Date(),
	//     getStarted: new Date(),
	//   },
	//   {
	//     roomName: 'Maaike',
	//     absenceName: 'Hannibal Smith',
	//     end: new Date(),
	//     getStarted: new Date(),
	//   },
	//   {
	//     roomName: 'Maaike',
	//     absenceName: 'Hannibal Smith',
	//     end: new Date(),
	//     getStarted: new Date(),
	//   },
	//   {
	//     roomName: 'Maaike',
	//     absenceName: 'Hannibal Smith',
	//     end: new Date(),
	//     getStarted: new Date(),
	//   },
	//   {
	//     roomName: 'Maaike',
	//     absenceName: 'Hannibal Smith',
	//     end: new Date(),
	//     getStarted: new Date(),
	//   },
	// ];

	public clipboardData: string = '';

	public downloadItems: NameValue[] = [];

	// public downloadItems: any[] = [
	//   {
	//     name: 'Excel',
	//     value: 'xls',
	//     description: 'Download as Excel',
	//   },
	//   {
	//     name: 'PDF',
	//     value: 'pdf',
	//     description: 'Download as PDF',
	//   },
	//   {
	//     name: 'CSV',
	//     value: 'csv',
	//     description: 'Download as CSV',
	//   },
	//   {
	//     name: 'Print',
	//     value: 'print',
	//     description: 'Print appointments',
	//   },
	// ];

	constructor(
		private dashboardApiService: DashboardApiService,
		private downloadSvc: DownloadService,
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
	) {
		super();
		this.roomAbsence$$ = new BehaviorSubject<any[]>([]);
		this.filteredRoomAbsence$$ = new BehaviorSubject<any[]>([]);
		this.dashboardApiService.roomAbsencePageNo = 1;

	}

	ngOnInit(): void {
		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

		this.filteredRoomAbsence$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				console.log('filter', items);
				this.tableData$$.next({
					items,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.roomAbsence$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (roomAbsence) => this.filteredRoomAbsence$$.next([...roomAbsence]),
		});

		this.dashboardApiService.roomAbsence$.pipe(takeUntil(this.destroy$$)).subscribe(
			(roomAbsenceBase) => {
				if (this.paginationData && this.paginationData.pageNo < roomAbsenceBase.metaData.pagination.pageNo) {
					this.roomAbsence$$.next([...this.roomAbsence$$.value, ...roomAbsenceBase.data]);
				} else {
					this.roomAbsence$$.next([...roomAbsenceBase.data]);
				}
				this.paginationData = roomAbsenceBase.metaData.pagination;
			},
			() => this.filteredRoomAbsence$$.next([]),
		);

		this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
			if (searchText) {
				this.handleSearch(searchText.toLowerCase());
			} else {
				this.filteredRoomAbsence$$.next([...this.roomAbsence$$.value]);
			}
		});

		this.downloadDropdownControl.valueChanges
			.pipe(
				filter((value) => !!value),
				takeUntil(this.destroy$$),
			)
			.subscribe((value) => {
				if (!this.filteredRoomAbsence$$.value.length) {
					return;
				}

				this.downloadSvc.downloadJsonAs(
					value as DownloadAsType,
					this.columns,
					this.filteredRoomAbsence$$.value.map((ap: any) => [
						ap?.roomName?.toString(),
						ap?.absenceName?.toString(),
						ap.startDate.toString(),
						ap.endDate.toString(),
					]),
					'unavailable-hall-period',
				);

				if (value !== 'PRINT') {
					this.notificationSvc.showNotification(`${Translate.DownloadSuccess(value)[this.selectedLang]}`);
				}

				this.downloadDropdownControl.setValue(null);

				this.cdr.detectChanges();
			});
		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => {
				this.selectedLang = lang;
				this.columns = [
					// Translate.Read[lang],
					Translate.RoomName[lang],
					Translate.StartDate[lang],
					Translate.EndDate[lang],
					Translate.AbsenceName[lang],
				];
			});
	}

	private handleSearch(searchText: string): void {
		this.filteredRoomAbsence$$.next([
			...this.roomAbsence$$.value.filter((appointment) => {
				return (
					appointment.roomName?.toLowerCase()?.includes(searchText) ||
					appointment.absenceName?.toLowerCase()?.includes(searchText) ||
					appointment.endDate?.toLowerCase()?.includes(searchText) ||
					appointment.startDate?.toString()?.includes(searchText)
				);
			}),
		]);
	}

	public copyToClipboard() {
		try {
			let dataString = `Room Name\t\t\tStarted At\t\t\t`;
			dataString += `${this.columns.slice(2).join('\t\t')}\n`;

			this.filteredRoomAbsence$$.value.forEach((ap: any) => {
				dataString += `${ap?.roomName?.toString()}\t${ap?.startDate?.toString()}\t\t${ap.endDate.toString()}\t\t${ap.absenceName.toString()}\n`;
			});

			this.clipboardData = dataString;
			this.cdr.detectChanges();
			this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
		} catch (e) {
			this.notificationSvc.showNotification(Translate.ErrorMessage.FailedToCopyData[this.selectedLang], NotificationType.DANGER);
			this.clipboardData = '';
		}
	}

	public onScroll(e: undefined): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.dashboardApiService.roomAbsencePageNo = this.dashboardApiService.roomAbsencePageNo + 1;
			this.tableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader): void {
		this.filteredRoomAbsence$$.next(GeneralUtils.SortArray(this.filteredRoomAbsence$$.value, e.sort, ColumnIdToKey[e.id]));
	}
}















