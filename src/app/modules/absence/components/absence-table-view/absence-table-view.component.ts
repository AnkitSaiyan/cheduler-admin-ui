import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DfmDatasource, DfmTableHeader, NotificationType, TableItem } from 'diflexmo-angular-design';
import { BehaviorSubject, debounceTime, filter, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { PermissionService } from 'src/app/core/services/permission.service';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { AbsenceApiService } from '../../../../core/services/absence-api.service';
import { DownloadAsType, DownloadService, DownloadType } from '../../../../core/services/download.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { Absence } from '../../../../shared/models/absence.model';
import { Translate } from '../../../../shared/models/translate.model';
import { ABSENCE_TYPE, ABSENCE_TYPE_ARRAY, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { GeneralUtils } from '../../../../shared/utils/general.utils';
import { AddAbsenceComponent } from '../add-absence/add-absence.component';
import { PaginationData } from 'src/app/shared/models/base-response.model';
import { DefaultDatePipe } from 'src/app/shared/pipes/default-date.pipe';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';


const ColumnIdToKey = {
	1: 'name',
	2: 'startedAt',
	3: 'endedAt',
	4: 'info',
};

@Component({
	selector: 'dfm-absence-table-view',
	templateUrl: './absence-table-view.component.html',
	styleUrls: ['./absence-table-view.component.scss'],
})
export class AbsenceTableViewComponent extends DestroyableComponent implements OnInit, OnDestroy {
	@HostListener('document:click', ['$event']) onClick() {
		this.toggleMenu(true);
	}

	private absences$$: BehaviorSubject<Absence[]>;

	public calendarView$$ = new BehaviorSubject<boolean>(false);

	public absenceType$$ = new BehaviorSubject<(typeof ABSENCE_TYPE_ARRAY)[number]>(ABSENCE_TYPE_ARRAY[0]);

	public filteredAbsences$$: BehaviorSubject<Absence[]>;

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public searchControl = new FormControl('', []);

	public downloadDropdownControl = new FormControl('', []);

	public columns: string[] = ['Title', 'StartDate', 'EndDate', 'AbsenceInfo', 'Actions'];

	public tableHeaders: DfmTableHeader[] = [
		{ id: '1', title: 'Title', isSortable: true },
		{ id: '2', title: 'StartDate', isSortable: true },
		{ id: '3', title: 'EndDate', isSortable: true },
		{ id: '4', title: 'AbsenceInfo', isSortable: true },
	];

	public downloadItems: DownloadType[] = [];

	private selectedLang: string = ENG_BE;

	public statuses = Statuses;

	public readonly Permission = Permission;

	public clipboardData: string = '';

	private paginationData: PaginationData | undefined;

	public isLoading: boolean = true;

	constructor(
		private absenceApiSvc: AbsenceApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private route: ActivatedRoute,
		private modalSvc: ModalService,
		private downloadSvc: DownloadService,
		private datePipe: DatePipe,
		private defaultDatePipe: DefaultDatePipe,
		private utcToLocalPipe: UtcToLocalPipe,
		private cdr: ChangeDetectorRef,
		private shareDataSvc: ShareDataService,
		public permissionSvc: PermissionService,
	) {
		super();
		this.absences$$ = new BehaviorSubject<any[]>([]);
		this.filteredAbsences$$ = new BehaviorSubject<any[]>([]);
		this.absenceApiSvc.pageNo = 1;
		this.permissionSvc.permissionType$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: () => {
				if (
					this.permissionSvc.isPermitted([Permission.UpdateAbsences, Permission.DeleteAbsences]) &&
					!this.tableHeaders.find(({ title }) => title === 'Actions' || title === 'Acties')
				) {
					this.tableHeaders = [
						...this.tableHeaders,
						{ id: this.tableHeaders?.length?.toString(), title: 'Actions', isSortable: false, isAction: true },
					];
				}
			},
		});
	}

	public ngOnInit(): void {
		this.route.data
			.pipe(
				tap(() => {
					this.absenceApiSvc.pageNo = 1;
				}),
				filter((data) => !!data[ABSENCE_TYPE]),
				map((data) => data[ABSENCE_TYPE]),
				switchMap((absenceType) => {
					this.absenceType$$.next(absenceType);
					return this.absenceApiSvc.absences$(absenceType);
				}),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (absencesBase) => {
					if (this.paginationData && this.paginationData.pageNo < absencesBase?.metaData?.pagination.pageNo) {
						this.absences$$.next([...this.absences$$.value, ...absencesBase.data]);
					} else {
						this.absences$$.next(absencesBase.data);
					}
					this.paginationData = absencesBase?.metaData?.pagination || 1;
					this.isLoading = false;
				},
				error: (e) => {
					this.absences$$.next([]);
				},
			});

		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => (this.downloadItems = items),
		});

		this.filteredAbsences$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (value) => {
				this.tableData$$.next({
					items: value,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.absences$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (absences) => this.handleSearch(this.searchControl.value ?? ''),
		});

		this.route.queryParams.pipe(takeUntil(this.destroy$$)).subscribe(({ search }) => {
			this.searchControl.setValue(search);
			if (search) {
				this.handleSearch(search.toLowerCase());
			} else {
				this.filteredAbsences$$.next([...this.absences$$.value]);
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
			.subscribe({
				next: (value) => {
					if (!this.filteredAbsences$$.value.length) {
						this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
						this.clearDownloadDropdown();
						return;
					}
					this.downloadSvc.downloadJsonAs(
						value as DownloadAsType,
						this.tableHeaders.map(({ title }) => title).filter((val) => val !== 'Actions'),
						this.filteredAbsences$$.value.map((u: Absence) => [
							u.name,
							this.defaultDatePipe.transform(this.utcToLocalPipe.transform(u.startedAt?.toString())) ?? '-',
							this.defaultDatePipe.transform(this.utcToLocalPipe.transform(u.endedAt?.toString())) ?? '-',
							u.info ?? '-',
						]),
						'absences',
					);

					if (value !== 'PRINT') {
						this.notificationSvc.showNotification(`${Translate.DownloadSuccess(value)[this.selectedLang]}`);
					}

					this.clearDownloadDropdown();
				},
			});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => {
					this.selectedLang = lang;
					this.tableHeaders = this.tableHeaders.map((h, i) => ({
						...h,
						title: Translate[this.columns[i]][lang],
					}));

					switch (lang) {
						case ENG_BE:
							this.statuses = Statuses;
							break;
						default:
							this.statuses = StatusesNL;
					}
				},
			});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	private handleSearch(searchText: string): void {
		this.filteredAbsences$$.next([
			...this.absences$$.value.filter((absence: Absence) => {
				return (
					absence.name?.toLowerCase()?.includes(searchText) ||
					this.datePipe.transform(absence?.startedAt, 'dd/MM/yyyy, HH:mm')?.includes(searchText) ||
					this.datePipe.transform(absence?.endedAt, 'dd/MM/yyyy, HH:mm')?.includes(searchText)
				);
			}),
		]);
	}

	public deleteAbsence(id: number) {
		const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText:
					this.absenceType$$.value === ABSENCE_TYPE_ARRAY?.[2]
						? 'AreyousureyouwanttodeletethisPunlicHoliday'
						: 'AreyousureyouwanttodeletethisAbsence',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		modalRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.absenceApiSvc.deleteAbsence$(id)),
				take(1),
			)
			.subscribe({
				next: () => {
					this.notificationSvc.showNotification(
						this.absenceType$$.value === ABSENCE_TYPE_ARRAY?.[2]
							? Translate.SuccessMessage.PublicHolidayDeleted[this.selectedLang]
							: Translate.SuccessMessage.AbsenceDeleted[this.selectedLang],
					);
					// filtering out deleted absence
					this.absences$$.next([...this.absences$$.value.filter((a) => +a.absenceId !== +id)]);
				},
			});
	}

	public copyToClipboard() {
		try {
			let dataString = `${this.tableHeaders
				.map(({ title }) => title)
				.filter((value) => value !== 'Actions')
				.join('\t')}\n`;

			if (!this.filteredAbsences$$.value.length) {
				this.notificationSvc.showNotification(Translate.NoDataFound[this.selectedLang], NotificationType.DANGER);
				this.clipboardData = '';
				return;
			}

			this.filteredAbsences$$.value.forEach((absence: Absence) => {
				dataString += `${absence.name}\t${this.utcToLocalPipe.transform(this.utcToLocalPipe.transform(absence?.startedAt?.toString()))}\t${this.utcToLocalPipe.transform(this.utcToLocalPipe.transform(absence?.endedAt?.toString()))}\t${absence.info}\n`;
			});

			this.clipboardData = dataString;

			this.cdr.detectChanges();
			this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
		} catch (e) {
			this.notificationSvc.showNotification(Translate.ErrorMessage.CopyToClipboard[this.selectedLang], NotificationType.DANGER);
			this.clipboardData = '';
		}
	}

	public navigateToViewAbsence(e: any) {
		if (e?.absenceId) {
			this.router.navigate([`./${e.absenceId}/view`], { relativeTo: this.route, queryParamsHandling: 'merge' });
		}
	}

	public toggleMenu(reset = false) {
		const icon = document.querySelector('.ph-li-plus-btn-icon');
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
					...this.absences$$.value.map(({ id, name }) => ({
						name: `${name}`,
						key: `${name}`,
						value: id,
					})),
				],
				placeHolder: 'Search by Absence Name',
			} as SearchModalData,
		});

		modalRef.closed.pipe(take(1)).subscribe((result) => this.filterAbsence(result));
	}

	private filterAbsence(result: { name: string; value: string }[]) {
		if (!result?.length) {
			this.filteredAbsences$$.next([...this.absences$$.value]);
			return;
		}

		const ids = new Set<number>();
		result.forEach((item) => ids.add(+item.value));
		this.filteredAbsences$$.next([...this.absences$$.value.filter((absence: Absence) => ids.has(+absence.id))]);
	}

	public openAddAbsenceModal(absenceDetails?: Absence) {
		this.modalSvc.open(AddAbsenceComponent, {
			data: { absenceType: this.absenceType$$.value, edit: !!absenceDetails?.absenceId, absenceID: absenceDetails?.absenceId },
			options: {
				size: 'xl',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
				backdrop: false,
				windowClass: 'modal-backdrop-enable-click',
				keyboard: false,
			},
		});
	}
	private clearDownloadDropdown() {
		setTimeout(() => {
			this.downloadDropdownControl.setValue('');
		}, 0);
	}

	public toggleView(): void {
		this.router.navigate([], {
			replaceUrl: true,
			queryParams: {
				v: !this.calendarView$$.value ? 'm' : 't',
			},
			queryParamsHandling: 'merge',
		});
	}

	public onScroll(e: undefined): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.absenceApiSvc.pageNo = this.paginationData.pageNo + 1;
			this.tableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader): void {
		this.filteredAbsences$$.next(GeneralUtils.SortArray(this.filteredAbsences$$.value, e.sort, ColumnIdToKey[e.id]));
	}
}


















