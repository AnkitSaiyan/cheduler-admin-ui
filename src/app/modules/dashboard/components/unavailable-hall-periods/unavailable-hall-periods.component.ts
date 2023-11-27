import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, debounceTime, filter, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DownloadAsType, DownloadService } from 'src/app/core/services/download.service';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { NameValue } from 'src/app/shared/components/search-modal.component';
import { DfmDatasource, DfmTableHeader, NotificationType } from 'diflexmo-angular-design';
import { Translate } from 'src/app/shared/models/translate.model';
import { ENG_BE, Statuses } from 'src/app/shared/utils/const';
import { PaginationData } from 'src/app/shared/models/base-response.model';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';
import { DefaultDatePipe } from 'src/app/shared/pipes/default-date.pipe';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';

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
		{ id: '1', title: 'Room Name', isSortable: true },
		{ id: '2', title: 'Started At', isSortable: true },
		{ id: '3', title: 'End', isSortable: true },
		{ id: '4', title: 'Absence Title', isSortable: true },
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

	public clipboardData: string = '';

	public downloadItems: NameValue[] = [];

	constructor(
		private dashboardApiService: DashboardApiService,
		private downloadSvc: DownloadService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private cdr: ChangeDetectorRef,
		private shareDataSvc: ShareDataService,
		private defaultDatePipe: DefaultDatePipe,
		private utcToLocalPipe: UtcToLocalPipe,
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

		this.dashboardApiService.roomAbsence$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (roomAbsenceBase) => {
				if (this.paginationData && this.paginationData.pageNo < roomAbsenceBase?.metaData?.pagination.pageNo) {
					this.roomAbsence$$.next([...this.roomAbsence$$.value, ...roomAbsenceBase.data]);
				} else {
					this.roomAbsence$$.next([...roomAbsenceBase.data]);
				}
				this.paginationData = roomAbsenceBase?.metaData?.pagination || 1;
			},
			error: () => this.filteredRoomAbsence$$.next([])
		});

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
					this.tableHeaders.map(({ title }) => title),
					this.filteredRoomAbsence$$.value.map((ap: any) => [
						ap?.roomName?.toString(),
						this.defaultDatePipe.transform(this.utcToLocalPipe.transform(ap?.startDate?.toString())) || '-',
						this.defaultDatePipe.transform(this.utcToLocalPipe.transform(ap?.endDate?.toString())) || '-',
						ap?.absenceName?.toString(),
					]),
					'unavailable-rooms-period',
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
				this.tableHeaders = this.tableHeaders.map((h, i) => ({
					...h,
					title: Translate[this.columns[i]][lang],
				}));
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
			let dataString = `${this.tableHeaders
				.map(({ title }) => title)
				.join('\t\t')}\n`;

			if (!this.filteredRoomAbsence$$.value.length) {
				this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.DANGER);
				this.clipboardData = '';
				return;
			}

			this.filteredRoomAbsence$$.value.forEach((ap: any) => {
				dataString += `${ap?.roomName?.toString()}\t\t${this.defaultDatePipe.transform(this.utcToLocalPipe.transform(ap?.startDate?.toString()))}\t\t${this.defaultDatePipe.transform(this.utcToLocalPipe.transform(ap?.endDate?.toString()))}\t\t${ap.absenceName.toString()}\n`;
			});

			this.clipboardData = dataString;
			this.cdr.detectChanges();
			this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
		} catch (e) {
			this.notificationSvc.showNotification(Translate.ErrorMessage.FailedToCopyData[this.selectedLang], NotificationType.DANGER);
			this.clipboardData = '';
		}
	}

	public onScroll(): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.dashboardApiService.roomAbsencePageNo = this.dashboardApiService.roomAbsencePageNo + 1;
			this.tableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader): void {
		this.filteredRoomAbsence$$.next(GeneralUtils.SortArray(this.filteredRoomAbsence$$.value, e.sort, ColumnIdToKey[e.id]));
	}

	public navigateToView(e: any) {
		if (e?.AbsenceId) {
			this.router.navigate([`/absence/rooms/${e.AbsenceId}/view`]);
		}
	}
}
