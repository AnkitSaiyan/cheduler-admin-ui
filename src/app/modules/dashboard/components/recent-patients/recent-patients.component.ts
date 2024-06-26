import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, takeUntil } from 'rxjs';
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
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';

const ColumnIdToKey = {
	1: 'patientFname',
	2: 'patientEmail',
	3: 'doctor',
	4: 'startedAt',
};

@Component({
	selector: 'dfm-recent-patients',
	templateUrl: './recent-patients.component.html',
	styleUrls: ['./recent-patients.component.scss'],
})
export class RecentPatientsComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public columns: string[] = ['PatientName', 'PatientEmail', 'Doctor', 'AppointmentDate'];

	public searchControl = new FormControl('', []);

	public downloadDropdownControl = new FormControl('', []);

	private selectedLang: string = ENG_BE;

	public statuses = Statuses;

	public downloadItems: NameValue[] = [];

	public clipboardData: string = '';

	private recentPatients$$: BehaviorSubject<any[]>;

	public filteredRecentPatients$$: BehaviorSubject<any[]>;

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public tableHeaders: DfmTableHeader[] = [
		{ id: '1', title: 'PatientName', isSortable: false },
		{ id: '2', title: 'EmailID', isSortable: false },
		{ id: '3', title: 'Doctor', isSortable: false },
		{ id: '4', title: 'AppointmentDate', isSortable: false },
	];

	private paginationData: PaginationData | undefined;

	constructor(
		private appointmentApiService: AppointmentApiService,
		private downloadSvc: DownloadService,
		private notificationSvc: NotificationDataService,
		private cdr: ChangeDetectorRef,
		private shareDataSvc: ShareDataService,
		private defaultDatePipe: DefaultDatePipe,
		private utcToLocalPipe: UtcToLocalPipe,
	) {
		super();
		this.recentPatients$$ = new BehaviorSubject<any[]>([]);
		this.filteredRecentPatients$$ = new BehaviorSubject<any[]>([]);
		this.appointmentApiService.recentPatientPageNo = 1;
	}

	public ngOnInit(): void {
		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

		this.filteredRecentPatients$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				this.tableData$$.next({
					items,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.recentPatients$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (recentPatient) => this.filteredRecentPatients$$.next([...recentPatient]),
		});

		this.appointmentApiService.recentPatients$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (recentPatientBase) => {
				if (this.paginationData && this.paginationData.pageNo < recentPatientBase?.metaData?.pagination.pageNo) {
					this.recentPatients$$.next([...this.recentPatients$$.value, ...recentPatientBase.data]);
				} else {
					this.recentPatients$$.next(recentPatientBase.data);
				}
				this.paginationData = {...recentPatientBase?.metaData?.pagination, lastDataLength: recentPatientBase.data.length};
			},
			error: () => this.recentPatients$$.next([]),
		});

		this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
			if (searchText) {
				this.handleSearch(searchText.toLowerCase());
			} else {
				this.filteredRecentPatients$$.next([...this.recentPatients$$.value]);
			}
		});

		this.downloadDropdownControl.valueChanges
			.pipe(
				filter((value) => !!value),
				takeUntil(this.destroy$$),
			)
			.subscribe((value) => {
				if (!this.filteredRecentPatients$$.value.length) {
					return;
				}

				this.downloadSvc.downloadJsonAs(
					value as DownloadAsType,
					this.tableHeaders.map(({ title }) => title).slice(0),
					this.filteredRecentPatients$$.value.map((ap: any) => [
						`${ap?.patientFname?.toString()} ${ap?.patientLname.toString()}`,
						ap?.patientEmail?.toString() || '-',
						ap?.doctor.toString() || '-',
						this.defaultDatePipe.transform(this.utcToLocalPipe.transform(ap.startedAt.toString())) || '-',
					]),
					'recent-patients',
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
		this.filteredRecentPatients$$.next([
			...this.recentPatients$$.value.filter((appointment) => {
				return (
					`${appointment.patientFname?.toLowerCase()} ${appointment.patientLname?.toLowerCase()}`.includes(searchText) ||
					appointment.patientEmail?.toLowerCase()?.includes(searchText) ||
					appointment.doctor?.toLowerCase()?.includes(searchText) ||
					appointment.startedAt?.toString()?.includes(searchText)
				);
			}),
		]);
	}

	public copyToClipboard() {
		try {
			let dataString = `${this.tableHeaders.map(({ title }) => title).join('\t\t')}\n`;

			if (!this.filteredRecentPatients$$.value.length) {
				this.notificationSvc.showNotification(Translate.NoDataToCopy[this.selectedLang], NotificationType.DANGER);
				this.clipboardData = '';
				return;
			}

			this.filteredRecentPatients$$.value.forEach((ap: any) => {
				dataString += `${
					ap?.patientFname?.toString() + ' ' + ap?.patientLname?.toString()
				}\t\t${ap?.patientEmail?.toString()}\t\t${ap.doctor.toString()}\t\t${this.defaultDatePipe.transform(
					this.utcToLocalPipe.transform(ap.startedAt.toString()),
				)}\n`;
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
		if (this.paginationData?.pageSize && this.paginationData?.pageNo && this.paginationData.pageSize === this.paginationData.lastDataLength) {
			this.appointmentApiService.recentPatientPageNo += 1;
			this.tableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader): void {
		this.filteredRecentPatients$$.next(GeneralUtils.SortArray(this.filteredRecentPatients$$.value, e.sort, ColumnIdToKey[e.id]));
	}
}
