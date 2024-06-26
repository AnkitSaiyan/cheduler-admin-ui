import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { DfmDatasource, DfmTableHeader, NotificationType, TableItem } from 'diflexmo-angular-design';
import { BehaviorSubject, Subject, combineLatest, debounceTime, filter, interval, map, switchMap, take, takeUntil } from 'rxjs';
import { PermissionService } from 'src/app/core/services/permission.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { UserService } from 'src/app/core/services/user.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { DownloadAsType, DownloadService, DownloadType } from '../../../../core/services/download.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { UserManagementApiService } from '../../../../core/services/user-management-api.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { PaginationData } from '../../../../shared/models/base-response.model';
import { ChangeStatusRequestData, Status, StatusToName } from '../../../../shared/models/status.model';
import { Translate } from '../../../../shared/models/translate.model';
import { SchedulerUser, User, UserBase, UserType } from '../../../../shared/models/user.model';
import { RoleNamePipe } from '../../../../shared/pipes/role-name.pipe';
import { ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { GeneralUtils } from '../../../../shared/utils/general.utils';
import { getStatusEnum } from '../../../../shared/utils/getEnums';
import { AddUserComponent } from '../add-user/add-user.component';

const SchedulerColumnIdToKey = {
	1: 'firstname',
	2: 'lastname',
	3: 'email',
	4: 'Role',
	5: 'Status',
};

@Component({
	selector: 'dfm-user-list',
	templateUrl: './user-list.component.html',
	styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent extends DestroyableComponent implements OnInit, OnDestroy {
	@HostListener('document:click', ['$event']) onClick() {
		this.toggleMenu(true);
	}

	@ViewChild('showMoreButtonIcon') private showMoreBtn!: ElementRef;

	@ViewChild('optionsMenu') private optionMenu!: NgbDropdown;

	private users$$: BehaviorSubject<UserBase[]>;

	public filteredUsers$$: BehaviorSubject<UserBase[]>;

	public clearSelected$$ = new Subject<void>();

	public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

	public loading$$ = new BehaviorSubject(true);

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public searchControl = new FormControl('', []);

	public downloadDropdownControl = new FormControl('', []);

	public columns: string[] = [];

	public columnsForScheduler: string[] = ['FirstName', 'LastName', 'Email', 'Role', 'Status', 'Actions'];

	public columnsForGeneral: string[] = ['FirstName', 'LastName', 'Email', 'Status', 'Actions'];

	public tableHeaders: DfmTableHeader[] = [];

	public downloadItems: DownloadType[] = [];

	public selectedUserIds: string[] = [];

	public statusTypeEnum = getStatusEnum();

	public statuses = Statuses;

	public readonly Permission = Permission;

	protected readonly UserType = UserType;

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
		private userManagementApiSvc: UserManagementApiService,
		public permissionSvc: PermissionService,
		private roleNamePipe: RoleNamePipe,
		public userSvc: UserService,
	) {
		super();
		this.users$$ = new BehaviorSubject<any[]>([]);
		this.filteredUsers$$ = new BehaviorSubject<any[]>([]);
		this.userApiSvc.pageNoUser = 1;
		this.updateColumns(this.columnsForScheduler);
	}

	public ngOnInit(): void {
		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (types) => (this.downloadItems = types),
		});

		this.filteredUsers$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (value) => {
				this.tableData$$.next({
					items: value,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.users$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (users) => {
				this.handleSearch(this.searchControl.value ?? '');
				users.forEach((user) => this.idsToObjMap.set(user.id.toString(), user));
			},
		});

		this.userManagementApiSvc.userList$.pipe(map((users) => users.items.map((user) => this.convertToUserBase(user)))).subscribe({
			next: (userBase) => {
				this.users$$.next([...userBase]);
				this.loading$$.next(false);
			},
			error: () => {
				this.users$$.next([]);
				this.loading$$.next(false);
			},
		});

		this.route.queryParams.pipe(takeUntil(this.destroy$$)).subscribe(({ search }) => {
			this.searchControl.setValue(search);
			if (search) {
				this.handleSearch(search.toLowerCase());
			} else {
				this.filteredUsers$$.next([...this.users$$.value]);
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
					if (!this.filteredUsers$$.value.length) {
						this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
						this.clearDownloadDropdown();
						return;
					}

					this.downloadSvc.downloadJsonAs(
						value as DownloadAsType,
						this.tableHeaders.map(({ title }) => title).filter((val) => val !== 'Actions'),
						this.filteredUsers$$.value.map((u: UserBase) => [
							u.firstname,
							u.lastname,
							u.email,
							this.roleNamePipe.transform(this.userApiSvc.userIdToRoleMap.get(u.id.toString())) || '-',
							Translate[StatusToName[+u.status]][this.selectedLang],
						]),
						'users',
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
						return [...this.selectedUserIds.map((id) => ({ id, status: value.newStatus as number }))];
					}

					return [];
				}),
				filter((changes) => {
					if (!changes.length) {
						this.clearSelected$$.next();
					}
					return !!changes.length;
				}),
				switchMap((changes) => {
					return this.userManagementApiSvc.changeUsersStates(
						changes.map(({ id, status }) => {
							return { id: id.toString(), accountEnabled: !!status };
						}),
					);
				}),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: () => {
					this.selectedUserIds.forEach((id) => {
						this.users$$.next([
							...GeneralUtils.modifyListData(
								this.users$$.value,
								{
									...(this.idsToObjMap.get(id.toString()) ?? {}),
									status: this.afterBannerClosed$$.value?.newStatus,
								},
								'update',
								'id',
							),
						]);
					});

					this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
					this.clearSelected$$.next();
				},
			});

		interval(0)
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: () => this.closeMenus(),
			});

		combineLatest([this.shareDataSvc.getLanguage$(), this.permissionSvc.permissionType$])
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: ([lang]) => {
					this.selectedLang = lang;

					if (
						!this.permissionSvc.isPermitted([Permission.UpdateUser, Permission.DeleteUser]) &&
						!this.tableHeaders.find(({ title }) => title === 'Actions' || title === 'Acties')
					) {
						this.tableHeaders = this.tableHeaders.filter((value) => value.title !== 'Actions' && value.title !== 'Acties');
					}

					this.tableHeaders = this.tableHeaders.map((h, i) => ({
						...h,
						title: Translate[this.columns[i]][lang] ?? this.columns[i],
					}));

					if (lang === ENG_BE) {
						this.statuses = Statuses;
					} else {
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
		this.selectedUserIds = [...selected];
	}

	public changeStatus(changes: ChangeStatusRequestData[], item: any) {
		this.userManagementApiSvc
			.changeUserState(changes[0].id as string, !!changes[0].status)
			.pipe(take(1))
			.subscribe({
				next: () => {
					this.users$$.next([
						...GeneralUtils.modifyListData(
							this.users$$.value,
							{
								...item,
								status: changes[0].status,
							},
							'update',
							'id',
						),
					]);
					this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
				},
			});
	}

	public deleteUser(id: number | string) {
		const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreyousureyouwanttodeletethisUser',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		dialogRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => {
					return this.userManagementApiSvc.deleteUser(id as string);
				}),
				take(1),
			)
			.subscribe({
				next: () => {
					this.users$$.next(GeneralUtils.modifyListData(this.users$$.value, { id }, 'delete', 'id'));
					this.notificationSvc.showNotification(Translate.SuccessMessage.UserDeleted[this.selectedLang]);
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

			if (!this.filteredUsers$$.value.length) {
				this.notificationSvc.showNotification(Translate.NoDataToCopy[this.selectedLang], NotificationType.DANGER);
				this.clipboardData = '';
				return;
			}

			this.filteredUsers$$.value.forEach((user: UserBase) => {
				dataString += `${user.firstname}\t${user.lastname}\t${user.email ?? '—'}\t${user.userType ?? '—'}\t${
					+user.status === 2 ? '-' : StatusToName[+user.status]
				}\n`;
			});

			this.clipboardData = dataString;

			this.cdr.detectChanges();
			this.notificationSvc.showNotification(`${Translate.SuccessMessage.CopyToClipboard[this.selectedLang]}!`);
		} catch (e) {
			this.notificationSvc.showNotification(`${Translate.ErrorMessage.CopyToClipboard[this.selectedLang]}!`, NotificationType.DANGER);
			this.clipboardData = '';
		}
	}

	public navigateToViewUser(e: TableItem) {
		if (e?.id) {
			const route = `./${e.id}/view`;
			this.router.navigate([route], { relativeTo: this.route, queryParamsHandling: 'merge' });
		}
	}

	public toggleMenu(reset = false) {
		const icon = document.querySelector('.us-li-plus-btn-icon');
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
					...this.users$$.value.map(({ id, firstname, lastname, userType }) => {
						return {
							name: `${firstname} ${lastname}`,
							description: userType,
							key: `${firstname} ${lastname}`,
							value: id,
						};
					}),
				],
				placeHolder: 'Search by User Name',
			} as SearchModalData,
		});

		modalRef.closed.pipe(take(1)).subscribe({
			next: (result) => {
				this.filterUserList(result);
			},
		});
	}

	public openAddUserModal(userDetails?: User) {
		const modalRef = this.modalSvc.open(AddUserComponent, {
			data: { edit: !!userDetails?.id, userDetails },
			options: {
				size: 'lg',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
				windowClass: 'modal-backdrop-enable-click',
			},
		});

		modalRef.closed.pipe(take(1)).subscribe({
			next: (res) => {
				if (res) {
					if (!isNaN(+res.id)) {
						return;
					}
					if (userDetails?.id) {
						this.users$$.next(GeneralUtils.modifyListData(this.users$$.value, res, 'update', 'id'));
					} else {
						const item = isNaN(+res.id) ? this.convertToUserBase(res as SchedulerUser) : (res as UserBase);
						this.users$$.next(GeneralUtils.modifyListData(this.users$$.value, item, 'add'));
					}
				}
			},
		});
	}

	private handleSearch(searchText: string): void {
		this.filteredUsers$$.next([
			...this.users$$.value.filter((user) => {
				let userType: any;
				let status: any;
				if (user.userType === 'Scheduler') userType = this.translate.instant('SchedulerUser');
				if (user.userType === 'General') userType = this.translate.instant('GeneralUser');
				if (user.status === 1) status = this.translate.instant('Active');
				if (user.status === 0) status = this.translate.instant('Inactive');
				return (
					`${user.firstname?.toLowerCase()} ${user.lastname?.toLowerCase()}`?.includes(searchText) ||
					user.firstname?.toLowerCase()?.includes(searchText) ||
					user.lastname?.toLowerCase()?.includes(searchText) ||
					user.email?.toLowerCase()?.includes(searchText) ||
					userType?.toLowerCase()?.includes(searchText) ||
					(user?.telephone as string)?.toLowerCase()?.includes(searchText) ||
					status?.toLowerCase()?.startsWith(searchText)
				);
			}),
		]);
	}

	private filterUserList(result: { name: string; value: string }[]) {
		if (!result?.length) {
			this.filteredUsers$$.next([...this.users$$.value]);
			return;
		}

		const ids = new Set<number>();
		result.forEach((item) => ids.add(+item.value));
		this.filteredUsers$$.next([...this.users$$.value.filter((user) => ids.has(+user.id))]);
	}

	private closeMenus() {
		if (window.innerWidth >= 680) {
			if (this.optionMenu?.isOpen()) {
				this.optionMenu.close();
				this.toggleMenu(true);
			}
		}
	}

	private clearDownloadDropdown() {
		setTimeout(() => {
			this.downloadDropdownControl.setValue('');
		}, 0);
	}

	private updateColumns(columns: string[]) {
		this.columns = [...columns];
		if (!this.permissionSvc.isPermitted([Permission.UpdateUser, Permission.DeleteUser])) {
			this.columns = this.columns.filter((value) => value !== 'Actions');
		}
		this.tableHeaders = this.columns.map((c, i) => ({
			id: (i + 1).toString(),
			title: Translate[c][this.selectedLang],
			isSortable: c !== 'Actions',
			isAction: c === 'Actions',
		}));
	}

	private convertToUserBase(user: SchedulerUser): UserBase {
		return {
			id: user.id,
			email: user.email,
			firstname: user.givenName,
			lastname: user.surname,
			fullName: user.displayName,
			userType: UserType.Scheduler,
			status: user.accountEnabled === null ? 2 : +user.accountEnabled,
			userRole: user?.userRole,
		} as unknown as UserBase;
	}

	public onScroll(): void {
		if (this.paginationData?.pageSize && this.paginationData?.pageNo && this.paginationData.pageSize === this.paginationData.lastDataLength) {
			this.tableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader): void {
		const key = SchedulerColumnIdToKey[e.id];
		this.filteredUsers$$.next(GeneralUtils.SortArray(this.filteredUsers$$.value, e.sort, key));
	}
}
