import {ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, switchMap, take, takeUntil } from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import { DfmDatasource, DfmTableHeader, NotificationType, TableItem } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { DownloadAsType, DownloadService, DownloadType } from '../../../../core/services/download.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { AddPrioritySlotsComponent } from '../add-priority-slots/add-priority-slots.component';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { TranslateService } from '@ngx-translate/core';
import { Permission } from 'src/app/shared/models/permission.model';
import { PermissionService } from 'src/app/core/services/permission.service';
import { PaginationData } from 'src/app/shared/models/base-response.model';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';
import { DefaultDatePipe } from 'src/app/shared/pipes/default-date.pipe';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';

const ColumnIdToKey = {
	1: 'startedAt',
	2: 'endedAt',
	3: 'priority',
};

@Component({
	selector: 'dfm-list-priority-slots',
	templateUrl: './list-priority-slots.component.html',
	styleUrls: ['./list-priority-slots.component.scss'],
})
export class ListPrioritySlotsComponent extends DestroyableComponent implements OnInit, OnDestroy {
	clipboardData: string = '';
	public searchControl = new FormControl('', []);
	public downloadDropdownControl = new FormControl('', []);
	public columns: string[] = ['Start', 'End', 'Priority', 'Actions'];

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public tableHeaders: DfmTableHeader[] = [
		{ id: '1', title: 'Start', isSortable: true },
		{ id: '2', title: 'End', isSortable: true },
		{ id: '3', title: 'Priority', isSortable: true },
	];
	public downloadItems: DownloadType[] = [];
	public filteredPrioritySlots$$: BehaviorSubject<any[]>;
	public statuses = Statuses;
	public calendarView$$ = new BehaviorSubject<boolean>(false);
	public readonly Permission = Permission;
	private prioritySlots$$: BehaviorSubject<any[]>;
	private selectedLang: string = ENG_BE;

	private paginationData: PaginationData | undefined;

	public isLoading: boolean = true;

	constructor(
		private priorityApiSvc: PrioritySlotApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private route: ActivatedRoute,
		private modalSvc: ModalService,
		private downloadSvc: DownloadService,
		private cdr: ChangeDetectorRef,
		private shareDataSvc: ShareDataService,
		private translate: TranslateService,
		public permissionSvc: PermissionService,
		private defaultDatePipe: DefaultDatePipe,
		private utcToLocalPipe: UtcToLocalPipe,
	) {
		super();
		this.prioritySlots$$ = new BehaviorSubject<any[]>([]);
		this.filteredPrioritySlots$$ = new BehaviorSubject<any[]>([]);
		this.priorityApiSvc.pageNo = 1;
		this.permissionSvc.permissionType$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: () => {
				if (
					this.permissionSvc.isPermitted([Permission.UpdatePrioritySlots, Permission.DeletePrioritySlots]) &&
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

	@HostListener('document:click', ['$event']) onClick() {
		this.toggleMenu(true);
	}

	ngOnInit(): void {
		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

		this.filteredPrioritySlots$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				this.tableData$$.next({
					items,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.prioritySlots$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (prioritySlot) => this.handleSearch(this.searchControl.value ?? ''),
		});

		this.priorityApiSvc.prioritySlots$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (prioritySlotBase) => {
				if (this.paginationData && this.paginationData.pageNo < prioritySlotBase?.metaData?.pagination.pageNo) {
					this.prioritySlots$$.next([...this.prioritySlots$$.value, ...prioritySlotBase.data]);
				} else {
					this.prioritySlots$$.next(prioritySlotBase.data);
				}
				this.paginationData = prioritySlotBase?.metaData?.pagination || 1;
				this.isLoading = false;
			},
			error: (e) => this.prioritySlots$$.next([]),
		});

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

		this.route.queryParams.pipe(takeUntil(this.destroy$$)).subscribe(({ search }) => {
			this.searchControl.setValue(search);
			if (search) {
				this.handleSearch(search.toLowerCase());
			} else {
				this.filteredPrioritySlots$$.next([...this.prioritySlots$$.value]);
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
			.subscribe((downloadAs) => {
				if (!this.filteredPrioritySlots$$.value.length) {
					this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
					this.clearDownloadDropdown();
					return;
				}

				this.downloadSvc.downloadJsonAs(
					downloadAs as DownloadAsType,
					this.columns.filter((value) => value !== 'Actions'),
					this.filteredPrioritySlots$$.value.map((pr: PrioritySlot) => [
						this.defaultDatePipe.transform(this.utcToLocalPipe.transform(pr?.startedAt?.toString())) ?? '',
						this.defaultDatePipe.transform(this.utcToLocalPipe.transform((pr.endedAt ? pr.endedAt : `${pr.startedAt.slice(0, -9)}, ${pr.slotEndTime}`)?.toString())) ?? '',
						// pr.endedAt ? pr.endedAt : `${pr.startedAt.slice(0, -9)}, ${pr.slotEndTime}`,
						pr.priority ?? '-',
					]),
					'priority slot details',
				);

				if (downloadAs !== 'PRINT') {
					this.notificationSvc.showNotification(`${Translate.DownloadSuccess(downloadAs)[this.selectedLang]}`);
				}
				this.clearDownloadDropdown();
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
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public deletePrioritySlot(id: number) {
		const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'Are you sure you want to delete this Priority Slot?',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		modalRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.priorityApiSvc.deletePrioritySlot$(id)),
				take(1),
			)
			.subscribe((response) => {
				if (response) {
					this.notificationSvc.showNotification(Translate.SuccessMessage.PrioritySlotsDeleted[this.selectedLang]);
				}
			});
	}

	public copyToClipboard() {
		try {
			let dataString = `${this.columns.filter((value) => value !== 'Actions').join('\t')}\n`;

			this.filteredPrioritySlots$$.value.forEach((prioritySlot: PrioritySlot) => {
				dataString += `${prioritySlot.startedAt}\t${prioritySlot.endedAt ? prioritySlot.endedAt : prioritySlot.startedAt.slice(0, -9)}\t${
					prioritySlot.priority
				}\n`;
			});

			this.clipboardData = dataString;

			this.cdr.detectChanges();
			this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
		} catch (e) {
			this.notificationSvc.showNotification(Translate.ErrorMessage.CopyToClipboard[this.selectedLang], NotificationType.DANGER);
			this.clipboardData = '';
		}
	}

	public navigateToViewAbsence(e: TableItem) {
		if (e?.id) {
			this.router.navigate([`./${e.id}/view`], { relativeTo: this.route, queryParamsHandling: 'merge' });
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

	public openAddPriorityModal(prioritySlotDetails?: PrioritySlot) {
		this.modalSvc.open(AddPrioritySlotsComponent, {
			data: { edit: !!prioritySlotDetails?.id, prioritySlotDetails },
			options: {
				size: 'xl',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
				keyboard: false,
				backdrop: false,
				windowClass: 'modal-backdrop-enable-click',
			},
		});
	}

	public toggleView(): void {
		this.router.navigate([], {
			replaceUrl: true,
			queryParams: {
				v: !this.calendarView$$.value ? 'w' : 't',
			},
			queryParamsHandling: 'merge',
		});
	}

	private handleSearch(searchText: string): void {
		this.filteredPrioritySlots$$.next([
			...this.prioritySlots$$.value.filter((priority) => {
				let status: any;
				if (priority.priority === 'High') status = this.translate.instant('High');
				if (priority.priority === 'Medium') status = this.translate.instant('Medium');
				if (priority.priority === 'Low') status = this.translate.instant('Low');

				return (
					priority.startedAt?.toLowerCase()?.includes(searchText) ||
					priority.endedAt?.toLowerCase()?.includes(searchText) ||
					status?.toLowerCase()?.startsWith(searchText)
				);
			}),
		]);
	}

	private clearDownloadDropdown() {
		setTimeout(() => {
			this.downloadDropdownControl.setValue('');
		}, 0);
	}

	public onRefresh(): void {
		this.priorityApiSvc.refresh();
	}

	public onScroll(e: any): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.priorityApiSvc.pageNo = this.priorityApiSvc.pageNo + 1;
			this.tableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader): void {
		this.filteredPrioritySlots$$.next(GeneralUtils.SortArray(this.filteredPrioritySlots$$.value, e.sort, ColumnIdToKey[e.id]));
	}
}







































