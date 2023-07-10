import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, debounceTime, filter, interval, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { DfmDatasource, DfmTableHeader, NotificationType, TableItem } from 'diflexmo-angular-design';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { ChangeStatusRequestData, Status, StatusToName } from '../../../../shared/models/status.model';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { getStatusEnum } from '../../../../shared/utils/getEnums';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { DownloadAsType, DownloadService } from '../../../../core/services/download.service';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Physician } from '../../../../shared/models/physician.model';
import { PhysicianAddComponent } from '../physician-add/physician-add.component';
import { ShareDataService } from '../../../../core/services/share-data.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Translate } from '../../../../shared/models/translate.model';
import { Permission } from 'src/app/shared/models/permission.model';
import { PermissionService } from 'src/app/core/services/permission.service';
import {PaginationData} from "../../../../shared/models/base-response.model";
import {GeneralUtils} from "../../../../shared/utils/general.utils";

const ColumnIdToKey = {
  1: 'firstname',
  2: 'lastname',
  3: 'email',
  4: 'status',
}

@Component({
	selector: 'dfm-physician-list',
	templateUrl: './physician-list.component.html',
	styleUrls: ['./physician-list.component.scss'],
})
export class PhysicianListComponent extends DestroyableComponent implements OnInit, OnDestroy {
	@HostListener('document:click', ['$event']) onClick() {
		this.toggleMenu(true);
	}

	@ViewChild('showMoreButtonIcon') private showMoreBtn!: ElementRef;

	@ViewChild('optionsMenu') private optionMenu!: NgbDropdown;

	// @ViewChild('actionsMenuButton') private actionsMenuButton!: ButtonComponent;

	private physicians$$: BehaviorSubject<Physician[]>;

	public filteredPhysicians$$: BehaviorSubject<Physician[]>;

	public clearSelected$$ = new Subject<void>();

	public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public searchControl = new FormControl('', []);

	public downloadDropdownControl = new FormControl('', []);

	public columns: string[] = ['FirstName', 'LastName', 'Email', 'Status', 'Actions'];

	public tableHeaders: DfmTableHeader[] = [
		{ id: '1', title: 'FirstName', isSortable: true },
		{ id: '2', title: 'LastName', isSortable: true },
		{ id: '3', title: 'Email', isSortable: true },
		{ id: '4', title: 'Status', isSortable: true },
	];

	public downloadItems: any[] = [];

	public selectedPhysicianIDs: string[] = [];

	public statusType = getStatusEnum();

	public statuses = Statuses;

	public readonly Permission = Permission;

	private selectedLang: string = ENG_BE;

	public clipboardData: string = '';

	private paginationData: PaginationData | undefined;

	constructor(
		private physicianApiSvc: PhysicianApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private route: ActivatedRoute,
		private modalSvc: ModalService,
		private downloadSvc: DownloadService,
		private cdr: ChangeDetectorRef,
		private shareDataSvc: ShareDataService,
		private translatePipe: TranslatePipe,
		private translate: TranslateService,
		public permissionSvc: PermissionService,
	) {
		super();
		this.physicians$$ = new BehaviorSubject<any[]>([]);
		this.filteredPhysicians$$ = new BehaviorSubject<any[]>([]);
    this.physicianApiSvc.pageNo = 1;
    this.permissionSvc.permissionType$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: () => {
				if (
					this.permissionSvc.isPermitted([Permission.UpdatePhysicians, Permission.DeletePhysicians]) &&
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
		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => (this.downloadItems = items),
		});

		this.filteredPhysicians$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				this.tableData$$.next({
					items,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.physicians$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (physicians) => this.filteredPhysicians$$.next([...physicians]),
		});

		this.physicianApiSvc.physicians$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (physicianBase) => {
				if (this.paginationData && this.paginationData.pageNo < physicianBase.metaData.pagination.pageNo) {
					this.physicians$$.next([...this.physicians$$.value, ...physicianBase.data]);
				} else {
					this.physicians$$.next(physicianBase.data);
				}
				this.paginationData = physicianBase.metaData.pagination;
			},
			error: (e) => this.physicians$$.next([]),
		});

		this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe({
			next: (searchText) => {
				if (searchText) {
					this.handleSearch(searchText.toLowerCase());
				} else {
					this.filteredPhysicians$$.next([...this.physicians$$.value]);
				}
			},
		});

		this.downloadDropdownControl.valueChanges
			.pipe(
				filter((value) => !!value),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (value) => {
					if (!this.filteredPhysicians$$.value.length) {
						this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
						this.clearDownloadDropdown();

						return;
					}

					this.downloadSvc.downloadJsonAs(
						value as DownloadAsType,
						this.tableHeaders.map(({ title }) => title).filter((val) => val !== 'Actions'),
						this.filteredPhysicians$$.value.map((p: Physician) => [
							p.firstname,
							p.lastname,
							p.email,
							Translate[StatusToName[+p.status]][this.selectedLang],
						]),
						'physician',
					);

					if (value !== 'PRINT') {
						this.notificationSvc.showNotification(Translate.DownloadSuccess(value)[this.selectedLang]);
					}

					this.clearDownloadDropdown();
				},
			});

		this.afterBannerClosed$$
			.pipe(
				map((value) => {
					if (value?.proceed) {
						return [...this.selectedPhysicianIDs.map((id) => ({ id: +id, status: value.newStatus as number }))];
					}
					return [];
				}),
				filter((changes) => {
					if (!changes.length) {
						this.clearSelected$$.next();
					}
					return !!changes.length;
				}),
				switchMap((changes) => this.physicianApiSvc.changePhysicianStatus$(changes)),
				takeUntil(this.destroy$$),
			)
			.subscribe((value) => {
				this.notificationSvc.showNotification(`${Translate.SuccessMessage.StatusChanged[this.selectedLang]}!`);
				this.clearSelected$$.next();
			});

		interval(0)
			.pipe(takeUntil(this.destroy$$))
			.subscribe(() => {
				this.closeMenus();
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

	public handleCheckboxSelection(selected: string[]) {
		this.toggleMenu(true);
		this.selectedPhysicianIDs = [...selected];
	}

	private handleSearch(searchText: string): void {
		this.filteredPhysicians$$.next([
			...this.physicians$$.value.filter((physician) => {
				let status: any;
				if (physician.status) status = this.translate.instant('Active');
				if (!physician.status) status = this.translate.instant('Inactive');

				return (
					physician.firstname?.toLowerCase()?.includes(searchText) ||
					physician.lastname?.toLowerCase()?.includes(searchText) ||
					physician.email?.toLowerCase()?.includes(searchText) ||
					status?.toLowerCase()?.startsWith(searchText)
				);
			}),
		]);
	}

	public changeStatus(changes: ChangeStatusRequestData[]) {
		this.physicianApiSvc
			.changePhysicianStatus$(changes)
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: () => this.notificationSvc.showNotification(`${Translate.SuccessMessage.StatusChanged[this.selectedLang]}!`),
				// error: (err) => this.notificationSvc.showNotification(Translate.Error.SomethingWrong[this.selectedLang], NotificationType.DANGER),
			});
	}

	public deletePhysician(id: number) {
		const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreyousureyouwanttodeletethisPhysician',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		modalRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.physicianApiSvc.deletePhysician(id)),
				take(1),
			)
			.subscribe({
				next: (response) => {
					this.notificationSvc.showNotification(`${Translate.SuccessMessage.PhysicianDeleted[this.selectedLang]}!`);
					// filtering out deleted physician
					this.physicians$$.next([...this.physicians$$.value.filter((p) => +p.id !== +id)]);
				},
			});
	}

	public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
		this.afterBannerClosed$$.next(e);
	}

	public copyToClipboard() {
		try {
			let dataString = `${this.tableHeaders
				.map(({ title }) => title)
				.filter((value) => value !== 'Actions')
				.join('\t')}\n`;

			this.filteredPhysicians$$.value.forEach((physician: Physician) => {
				dataString += `${physician.firstname}\t${physician.lastname}\t ${physician.email}\t ${StatusToName[+physician.status]}\n`;
			});

			this.clipboardData = dataString;

			this.cdr.detectChanges();
			this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
		} catch (e) {
			this.notificationSvc.showNotification(Translate.ErrorMessage.CopyToClipboard[this.selectedLang], NotificationType.DANGER);
			this.clipboardData = '';
		}
	}

	public navigateToViewPhysician(e: TableItem) {
		if (e?.id) {
			this.router.navigate([`./${e.id}/view`], { relativeTo: this.route });
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
					...this.physicians$$.value.map(({ id, firstname, lastname, email, status }) => ({
						name: `${firstname} ${lastname}`,
						description: email,
						key: `${firstname} ${lastname} ${email} ${Statuses[+status]}`,
						value: id,
					})),
				],
				placeHolder: 'Search by Physician Name, Email, Description',
			} as SearchModalData,
		});

		modalRef.closed.pipe(take(1)).subscribe({
			next: (result) => this.filterPhysicians(result),
		});
	}

	private filterPhysicians(result: { name: string; value: string }[]) {
		if (!result?.length) {
			this.filteredPhysicians$$.next([...this.physicians$$.value]);
			return;
		}

		const ids = new Set<number>();
		result.forEach((item) => ids.add(+item.value));
		this.filteredPhysicians$$.next([...this.physicians$$.value.filter((physician: Physician) => ids.has(+physician.id))]);
	}

	public openAddPhysicianModal(physicianDetails?: Physician) {
		this.modalSvc.open(PhysicianAddComponent, {
			data: { edit: !!physicianDetails?.id, physicianDetails },
			options: {
				size: 'lg',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
			},
		});
	}

	private closeMenus() {
		if (window.innerWidth >= 680) {
			if (this.optionMenu && this.optionMenu.isOpen()) {
				this.optionMenu.close();
				this.toggleMenu(true);
			}
		}
	}
	private clearDownloadDropdown() {
		const timeout = setTimeout(() => {
			this.downloadDropdownControl.setValue('');
			clearTimeout(timeout);
		}, 0);
	}

	public onScroll(e: undefined): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.physicianApiSvc.pageNo = this.physicianApiSvc.pageNo + 1;
			this.tableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader): void {
		this.filteredPhysicians$$.next(GeneralUtils.SortArray(this.filteredPhysicians$$.value, e.sort, ColumnIdToKey[e.id]));
	}
}
