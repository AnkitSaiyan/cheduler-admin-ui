import {ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, debounceTime, filter, map, Subject, switchMap, take, takeUntil} from 'rxjs';
import {FormControl} from '@angular/forms';
import {DfmDatasource, DfmTableHeader, NotificationType, TableItem} from 'diflexmo-angular-design';
import {ActivatedRoute, Router} from '@angular/router';
import {getStatusEnum} from '../../../../shared/utils/getEnums';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {ChangeStatusRequestData, Status, StatusToName} from '../../../../shared/models/status.model';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {
    ConfirmActionModalComponent,
    ConfirmActionModalData
} from '../../../../shared/components/confirm-action-modal.component';
import {ModalService} from '../../../../core/services/modal.service';
import {SearchModalComponent, SearchModalData} from '../../../../shared/components/search-modal.component';
import {User} from '../../../../shared/models/user.model';
import {DownloadAsType, DownloadService, DownloadType} from '../../../../core/services/download.service';
import {ENG_BE, Statuses, StatusesNL} from '../../../../shared/utils/const';
import {Translate} from '../../../../shared/models/translate.model';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {TranslateService} from '@ngx-translate/core';
import {Permission} from 'src/app/shared/models/permission.model';
import {PermissionService} from 'src/app/core/services/permission.service';
import {UserApiService} from "../../../../core/services/user-api.service";
import { TitleCasePipe } from '@angular/common';
import {PaginationData} from "../../../../shared/models/base-response.model";
import {GeneralUtils} from "../../../../shared/utils/general.utils";

const ColumnIdToKey = {
	1: 'firstname',
	2: 'lastname',
	3: 'userType',
	4: 'email',
	5: 'status'
}

@Component({
	selector: 'dfm-staff-list',
	templateUrl: './staff-list.component.html',
	styleUrls: ['./staff-list.component.scss'],
})
export class StaffListComponent extends DestroyableComponent implements OnInit, OnDestroy {
	@HostListener('document:click', ['$event']) onClick() {
		this.toggleMenu(true);
	}

	@ViewChild('showMoreButtonIcon') private showMoreBtn!: ElementRef;

	private staffs$$: BehaviorSubject<User[]>;

	public filteredStaffs$$: BehaviorSubject<User[]>;

	public clearSelected$$ = new Subject<void>();

	public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public searchControl = new FormControl('', []);

	public downloadDropdownControl = new FormControl('', []);

	public columns: string[] = ['FirstName', 'LastName', 'Type', 'Email', 'Status'];

	public tableHeaders: DfmTableHeader[] = [
		{ id: '1', title: 'FirstName', isSortable: true },
		{ id: '2', title: 'LastName', isSortable: true },
		{ id: '3', title: 'Type', isSortable: true },
		{ id: '4', title: 'Email', isSortable: true },
		{ id: '5', title: 'Status', isSortable: true },
	];

	public downloadItems: DownloadType[] = [];

	public selectedStaffIds: string[] = [];

	public statusType = getStatusEnum();

	public statuses = Statuses;

	public readonly Permission = Permission;

	private selectedLang: string = ENG_BE;

	public clipboardData: string = '';

	private paginationData: PaginationData | undefined;

	private idsToObjMap: Map<string, any> = new Map<string, any>();

	constructor(
		private userApiSvc: UserApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private route: ActivatedRoute,
		private modalSvc: ModalService,
		private downloadSvc: DownloadService,
		private cdr: ChangeDetectorRef,
		private shareDataSvc: ShareDataService,
		private translate: TranslateService,
		public permissionSvc: PermissionService,
		public titleCasePipe: TitleCasePipe,
	) {
		super();
		this.staffs$$ = new BehaviorSubject<any[]>([]);
		this.filteredStaffs$$ = new BehaviorSubject<any[]>([]);
		this.userApiSvc.pageNoStaff = 1;
	}

	public ngOnInit(): void {
		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => (this.downloadItems = items)
		});

		this.filteredStaffs$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (value) => {
				this.tableData$$.next({
					items: value,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false
				});
			}
		});

		this.staffs$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (staffs) => {
				this.filteredStaffs$$.next([...staffs])
				staffs.forEach((staff) => this.idsToObjMap.set(staff.id.toString(), staff));
			}
		});

		this.userApiSvc.staffs$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (staffBase) => {
				// if (this.paginationData && this.paginationData.pageNo < staffBase.metaData.pagination.pageNo) {
				// } else {
				// 	this.staffs$$.next(staffBase.data);
				// }

				this.staffs$$.next([...this.staffs$$.value, ...staffBase.data]);
				this.paginationData = staffBase.metaData.pagination;
			},
			error: (e) => {
				this.staffs$$.next([]);
			}
		});

		this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe({
			next: (searchText) => {
				if (searchText) {
					this.handleSearch(searchText.toLowerCase());
				} else {
					this.filteredStaffs$$.next([...this.staffs$$.value]);
				}
			}
		});

		this.downloadDropdownControl.valueChanges
			.pipe(
				filter((value) => !!value),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (value) => {
					if (!this.filteredStaffs$$.value.length) {
						this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
						this.clearDownloadDropdown();
						return;
					}

					this.downloadSvc.downloadJsonAs(
						value as DownloadAsType,
						this.tableHeaders.map(({ title }) => title),
						this.filteredStaffs$$.value.map((u: User) => [
							u.firstname,
							u.lastname,
							Translate.StaffTypes[this.titleCasePipe.transform(u.userType)][this.selectedLang],
							u.email,
							Translate[StatusToName[+u.status]][this.selectedLang],
						]),
						'staffs',
					);

					if (value !== 'PRINT') {
						this.notificationSvc.showNotification(Translate.DownloadSuccess(value)[this.selectedLang]);
					}

					this.clearDownloadDropdown();
				}
			});

		this.afterBannerClosed$$
			.pipe(
				map((value) => {
					if (value?.proceed) {
						return [...this.selectedStaffIds.map((id) => ({ id: +id, status: value.newStatus as number }))];
					}

					return [];
				}),
				filter((changes) => {
					if (!changes.length) {
						this.clearSelected$$.next();
					}
					return !!changes.length;
				}),
				switchMap((changes) => this.userApiSvc.changeUserStatus$(changes)),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: () => {
					this.selectedStaffIds.map((id) => {
						this.staffs$$.next([...GeneralUtils.modifyListData(this.staffs$$.value, {
							...(this.idsToObjMap.get(id.toString()) ?? {}),
							status: this.afterBannerClosed$$.value?.newStatus,
						}, 'update', 'id')]);
					});
					this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
					this.clearSelected$$.next();
				}
			});

		this.shareDataSvc.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => {
					this.selectedLang = lang;

					this.tableHeaders = this.tableHeaders.map((h, i) => ({
						...h, title: Translate[this.columns[i]][lang]
					}));

					switch (lang) {
						case ENG_BE:
							this.statuses = Statuses;
							break;
						default:
							this.statuses = StatusesNL;
					}
				}
			});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public handleCheckboxSelection(selected: string[]) {
		this.toggleMenu(true);
		this.selectedStaffIds = [...selected];
	}

	public changeStatus(changes: ChangeStatusRequestData[], item: any) {
		this.userApiSvc
			.changeUserStatus$(changes)
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: () => {
					this.staffs$$.next([...GeneralUtils.modifyListData(this.staffs$$.value, {
						...item, status: changes[0].status
					}, 'update', 'id')]);
					this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
				},
				error: (err) => this.notificationSvc.showNotification(err, NotificationType.DANGER),
			});
	}

	public deleteStaff(id: number) {
		const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreYouSureYouWantToDeleteThisStaff',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		dialogRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.userApiSvc.deleteUser(id)),
				take(1),
			)
			.subscribe({
				next: (response) => {
					this.staffs$$.next(GeneralUtils.modifyListData(this.staffs$$.value, { id }, 'delete', 'id'));
					this.notificationSvc.showNotification(Translate.SuccessMessage.StaffDeleted[this.selectedLang]);
				}
			});
	}

	public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
		this.afterBannerClosed$$.next(e);
	}

	public copyToClipboard() {
		try {
			let dataString = `${this.tableHeaders.map(({ title }) => title).join('\t')}\n`;

			this.filteredStaffs$$.value.forEach((staff: User) => {
				dataString += `${staff.firstname}\t${staff.lastname}\t ${staff.userType}\t ${staff.email}\t${StatusToName[+staff.status]}\n`;
			});

			this.clipboardData = dataString;

			this.cdr.detectChanges();
			this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
		} catch (e) {
			this.notificationSvc.showNotification(Translate.ErrorMessage.CopyToClipboard[this.selectedLang], NotificationType.DANGER);
			this.clipboardData = '';
		}
	}

	public navigateToViewStaff(e: TableItem) {
		if (e?.id) {
			this.router.navigate([`./${e.id}/view`], { relativeTo: this.route });
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
					...this.staffs$$.value.map(({ id, firstname, lastname, email, userType }) => {
						return {
							name: `${firstname} ${lastname}`,
							description: userType,
							key: `${firstname} ${lastname} ${email} ${userType}`,
							value: id,
						};
					}),
				],
				placeHolder: 'Search by Staff Name, Type, Email...',
			} as SearchModalData,
		});

		modalRef.closed.pipe(take(1)).subscribe({
			next: (result) => this.filterStaffList(result)
		});
	}

	private handleSearch(searchText: string): void {
		this.filteredStaffs$$.next([
			...this.staffs$$.value.filter((staff) => {
				let type: any;
				let status: any;
				if (staff.userType === 'Radiologist') type = this.translate.instant('Radiologist');
				if (staff.userType === 'Nursing') type = this.translate.instant('Nursing');
				if (staff.userType === 'Assistant') type = this.translate.instant('Assistant');
				if (staff.userType === 'Secretary') type = this.translate.instant('Secretary');
				if (staff.status === 1) status = this.translate.instant('Active');
				if (staff.status === 0) status = this.translate.instant('Inactive');
				return (
					staff.firstname?.toLowerCase()?.includes(searchText) ||
					staff.lastname?.toLowerCase()?.includes(searchText) ||
					staff.email?.toLowerCase()?.includes(searchText) ||
					type?.toLowerCase()?.includes(searchText) ||
					status?.toLowerCase()?.includes(searchText)
				);
			}),
		]);
	}

	private filterStaffList(result: { name: string; value: string }[]) {
		if (!result?.length) {
			this.filteredStaffs$$.next([...this.staffs$$.value]);
			return;
		}

		const ids = new Set<number>();
		result.forEach((item) => ids.add(+item.value));
		this.filteredStaffs$$.next([...this.staffs$$.value.filter((staff: User) => ids.has(+staff.id))]);
	}

	private clearDownloadDropdown() {
		setTimeout(() => {
			this.downloadDropdownControl.setValue('');
		}, 0);
	}

	public onScroll(e: undefined): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.userApiSvc.pageNoStaff = this.userApiSvc.pageNoStaff + 1;
			this.tableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader): void {
		this.filteredStaffs$$.next(GeneralUtils.SortArray(this.filteredStaffs$$.value, e.sort, ColumnIdToKey[e.id]));
	}
}
