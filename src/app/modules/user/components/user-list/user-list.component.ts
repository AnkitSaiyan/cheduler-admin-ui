import {ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    filter, from,
    interval,
    map, observable,
    Observable,
    of,
    Subject,
    switchMap,
    take,
    takeUntil, tap
} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {NotificationType, TableItem} from 'diflexmo-angular-design';
import {NgbDropdown} from '@ng-bootstrap/ng-bootstrap';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {ChangeStatusRequestData, Status, StatusToName} from '../../../../shared/models/status.model';
import {getStatusEnum} from '../../../../shared/utils/getEnums';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {ModalService} from '../../../../core/services/modal.service';
import {
    ConfirmActionModalComponent,
    ConfirmActionModalData
} from '../../../../shared/components/confirm-action-modal.component';
import {NameValue, SearchModalComponent, SearchModalData} from '../../../../shared/components/search-modal.component';
import {User, UserBase, UserRoleEnum, UserType} from '../../../../shared/models/user.model';
import {DownloadAsType, DownloadService, DownloadType} from '../../../../core/services/download.service';
import {AddUserComponent} from '../add-user/add-user.component';
import {DUTCH_BE, ENG_BE, Statuses, StatusesNL} from '../../../../shared/utils/const';
import {Translate} from '../../../../shared/models/translate.model';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {TranslateService} from '@ngx-translate/core';
import {UserManagementApiService} from "../../../../core/services/user-management-api.service";
import {Permission} from 'src/app/shared/models/permission.model';
import {PermissionService} from 'src/app/core/services/permission.service';
import {UserApiService} from "../../../../core/services/user-api.service";
import {RoleNamePipe} from "../../../../shared/pipes/role-name.pipe";

@Component({
    selector: 'dfm-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent extends DestroyableComponent implements OnInit, OnDestroy {
    @ViewChild('showMoreButtonIcon') private showMoreBtn!: ElementRef;
    @ViewChild('optionsMenu') private optionMenu!: NgbDropdown;

    @HostListener('document:click', ['$event']) onClick() {
        this.toggleMenu(true);
    }

    public searchControl = new FormControl('', []);
    public downloadDropdownControl = new FormControl('', []);
    public userTypeDropdownControl = new FormControl('', []);

    public columns$$: BehaviorSubject<string[]>;
    public filteredUsers$$: BehaviorSubject<any[]>;
    public clearSelected$$ = new Subject<void>();
    public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);
    public loading$$ = new BehaviorSubject(true);

    public columnsForScheduler: string[] = ['FirstName', 'LastName', 'Email', 'Category', 'Role', 'Status', 'Actions'];
    public columnsForGeneral: string[] = ['FirstName', 'LastName', 'Email', 'Category', 'Status', 'Actions'];
    public downloadItems: DownloadType[] = [];
    public selectedUserIds: string[] = [];
    public statusTypeEnum = getStatusEnum();
    public statuses = Statuses;
    public userTypes: NameValue[] = [
        {
            value: UserType.General,
            name: UserType.General + ' User',
        },
        {
            value: UserType.Scheduler,
            name: UserType.Scheduler + ' User',
        },
    ];
    public readonly Permission = Permission;
    protected readonly UserType = UserType;
    private users$$: BehaviorSubject<any[]>;
    private selectedLang: string = ENG_BE;
    public clipboardData: string = '';

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
        private roleNamePipe: RoleNamePipe
    ) {
        super();
        this.users$$ = new BehaviorSubject<any[]>([]);
        this.filteredUsers$$ = new BehaviorSubject<any[]>([]);
        this.columns$$ = new BehaviorSubject<string[]>(this.columnsForScheduler);
    }

    public ngOnInit(): void {
        this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
            next: (types) => (this.downloadItems = types),
        });

        setTimeout(() => this.userTypeDropdownControl.setValue(UserType.General), 0);

        this.userTypeDropdownControl.valueChanges
            .pipe(
                debounceTime(0),
                distinctUntilChanged(),
                switchMap((userType) => {
                    this.users$$.next([]);
                    this.filteredUsers$$.next([]);

                    switch (userType) {
                        case UserType.Scheduler: {
                            this.columns$$.next(this.columnsForScheduler);
                            return this.userManagementApiSvc.userList$.pipe(
                                map((users) =>
                                    users.map((user) => {
                                        return {
                                            id: user.id,
                                            email: user.email,
                                            firstname: user.givenName,
                                            lastname: user.surname,
                                            fullName: user.displayName,
                                            userType: UserType.Scheduler,
                                            status: +user.accountEnabled,
                                            userRole: user?.userRole,
                                        } as unknown as UserBase;
                                    }),
                                ),
                            );
                        }
                        default: {
                            this.columns$$.next(this.columnsForGeneral);
                            return this.userApiSvc.generalUsers$;
                        }
                    }
                }),
                takeUntil(this.destroy$$),
            )
            .subscribe({
                next: (users) => {
                    this.users$$.next([...users]);
                    this.filteredUsers$$.next([...users]);
                    this.loading$$.next(false);
                },
                error: () => this.loading$$.next(false),
            });

        this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe({
            next: (searchText) => {
                if (searchText) {
                    this.handleSearch(searchText.toLowerCase());
                } else {
                    this.filteredUsers$$.next([...this.users$$.value]);
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
                    if (!this.filteredUsers$$.value.length) {
                        this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
                        this.clearDownloadDropdown();
                        return;
                    }

                    this.downloadSvc.downloadJsonAs(
                        value as DownloadAsType,
                        this.columns$$.value.slice(0, -1),
                        this.filteredUsers$$.value.map((u: User) => [
                            u.firstname,
                            u.lastname,
                            u.email,
                            u.userType,
                            ...(this.userTypeDropdownControl.value === UserType.Scheduler ? [this.roleNamePipe.transform(this.userApiSvc.userIdToRoleMap.get(u.id.toString()))] : []),
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
                        return [...this.selectedUserIds.map((id) => ({id: id, status: value.newStatus as number}))];
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
                    switch (this.userTypeDropdownControl.value) {
                        case UserType.General:
                            return  this.userApiSvc.changeUserStatus$(changes);
                        case UserType.Scheduler:
                            return this.userManagementApiSvc.changeUsersStates(changes.map(({id, status}) => {
                                return { id: id.toString(), accountEnabled: !!status };
                            }));
                        default:
                            return from([null]).pipe(
                                tap(() => {
                                    this.notificationSvc.showError('Something wen wrong');
                                    this.clearSelected$$.next();
                                }),
                                filter((res) => !!res)
                            )
                    }
                }),
                takeUntil(this.destroy$$),
            )
            .subscribe({
                next: (value) => {
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
                next: ([lang, permissionType]) => {
                    this.selectedLang = lang;
                    this.columnsForGeneral = [
                        Translate.FirstName[lang],
                        Translate.LastName[lang],
                        Translate.Email[lang],
                        Translate.Category[lang],
                        Translate.Status[lang],
                    ];
                    this.columnsForScheduler = [
                        Translate.FirstName[lang],
                        Translate.LastName[lang],
                        Translate.Email[lang],
                        Translate.Category[lang],
                        'Role',
                        Translate.Status[lang],
                    ];

                    if (this.permissionSvc.isPermitted([Permission.UpdateUser, Permission.DeleteUser])) {
											this.columnsForGeneral = [...this.columnsForGeneral, Translate.Actions[lang]];
											this.columnsForScheduler = [...this.columnsForScheduler, Translate.Actions[lang]];
										}

                    if (this.userTypeDropdownControl.value === UserType.General) {
                        this.columns$$.next(this.columnsForGeneral);
                    } else {
                        this.columns$$.next(this.columnsForScheduler);
                    }

                    // eslint-disable-next-line default-case
                    switch (lang) {
                        case ENG_BE:
                            this.statuses = Statuses;
                            break;
                        case DUTCH_BE:
                            this.statuses = StatusesNL;
                            break;
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

    public changeStatus(changes: ChangeStatusRequestData[]) {
        let observable: Observable<any>;
        switch (this.userTypeDropdownControl.value) {
            case UserType.General:
                observable = this.userApiSvc.changeUserStatus$(changes);
                break;
            default:
                observable = this.userManagementApiSvc.changeUserState(changes[0].id as string, !!changes[0].status);
        }

        observable.pipe(take(1)).subscribe({
            next: () => this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]),
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
                    console.log()
                    if (this.userTypeDropdownControl.value === UserType.Scheduler) {
                        return this.userManagementApiSvc.deleteUser(id as string);
                    }
                    return this.userApiSvc.deleteUser(id as number);
                }),
                take(1),
            )
            .subscribe({
                next: () => {
                    this.notificationSvc.showNotification(Translate.SuccessMessage.UserDeleted[this.selectedLang]);
                },
            });
    }

    public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
        this.afterBannerClosed$$.next(e);
    }

    public copyToClipboard() {
        try {
            let dataString = `${this.columns$$.value.slice(0, -1).join('\t')}\n`;

            this.filteredUsers$$.value.forEach((user: User) => {
                dataString += `${user.firstname}\t${user.lastname}\t${user.email ?? '—'}\t${user.telephone ?? '—'}\t${user.userType ?? '—'}\t${
                    StatusToName[+user.status]
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
            let route = `./${e.id}`;
            route += this.userTypeDropdownControl.value === UserType.Scheduler ? '/s/view' : '/g/view';
            this.router.navigate([route], {relativeTo: this.route});
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
            options: {fullscreen: true},
            data: {
                items: [
                    ...this.users$$.value.map(({id, firstname, lastname, userType}) => {
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
            next: (result) => this.filterUserList(result),
        });
    }

    public openAddUserModal(userDetails?: User) {
        this.modalSvc.open(AddUserComponent, {
            data: {edit: !!userDetails?.id, userDetails},
            options: {
                size: 'lg',
                centered: true,
                backdropClass: 'modal-backdrop-remove-mv',
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
                    user.firstname?.toLowerCase()?.includes(searchText) ||
                    user.lastname?.toLowerCase()?.includes(searchText) ||
                    user.email?.toLowerCase()?.includes(searchText) ||
                    userType?.toLowerCase()?.includes(searchText) ||
                    user.telephone?.toLowerCase()?.includes(searchText) ||
                    status.toLowerCase()?.startsWith(searchText)
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
        this.filteredUsers$$.next([...this.users$$.value.filter((user: User) => ids.has(+user.id))]);
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
        setTimeout(() => {
            this.downloadDropdownControl.setValue('');
        }, 0);
    }
}
