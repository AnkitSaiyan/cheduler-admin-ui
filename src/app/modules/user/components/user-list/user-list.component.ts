import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, interval, map, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationType, TableItem } from 'diflexmo-angular-design';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ChangeStatusRequestData, Status, StatusToName } from '../../../../shared/models/status.model';
import { getStatusEnum, getUserTypeEnum } from '../../../../shared/utils/getEnums';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { User } from '../../../../shared/models/user.model';
import { DownloadAsType, DownloadService, DownloadType } from '../../../../core/services/download.service';
import { AddUserComponent } from '../add-user/add-user.component';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'dfm-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  clipboardData: string = '';

  @HostListener('document:click', ['$event']) onClick() {
    this.toggleMenu(true);
  }

  @ViewChild('showMoreButtonIcon') private showMoreBtn!: ElementRef;

  @ViewChild('optionsMenu') private optionMenu!: NgbDropdown;

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['FirstName', 'LastName', 'Email', 'Telephone', 'Category', 'Status', 'Actions'];

  public downloadItems: DownloadType[] = [];

  private users$$: BehaviorSubject<any[]>;

  public filteredUsers$$: BehaviorSubject<any[]>;

  public clearSelected$$ = new Subject<void>();

  public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

  public selectedUserIds: string[] = [];

  public statusType = getStatusEnum();

  public userType = getUserTypeEnum();

  public loading$$ = new BehaviorSubject(true);

  public fileName: string = '';

  private selectedLang: string = ENG_BE;

  public statuses = Statuses;

  constructor(
    private userApiSvc: StaffApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private downloadSvc: DownloadService,
    private cdr: ChangeDetectorRef,
    private shareDataSvc: ShareDataService,
    private translate: TranslateService,
  ) {
    super();
    this.users$$ = new BehaviorSubject<any[]>([]);
    this.filteredUsers$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((types) => {
      this.downloadItems = types;
    });

    this.userApiSvc.userLists$
      .pipe(
        tap(() => this.loading$$.next(true)),
        takeUntil(this.destroy$$),
      )
      .subscribe(
        (users) => {
          this.users$$.next(users);
          this.filteredUsers$$.next(users);
          this.loading$$.next(false);
        },
        (err) => this.loading$$.next(false),
      );

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
      if (searchText) {
        this.handleSearch(searchText.toLowerCase());
      } else {
        this.filteredUsers$$.next([...this.users$$.value]);
      }
    });

    this.downloadDropdownControl.valueChanges
      .pipe(
        filter((value) => !!value),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => {
        if (!this.filteredUsers$$.value.length) {
          return;
        }

        this.downloadSvc.downloadJsonAs(
          value as DownloadAsType,
          this.columns.slice(0, -1),
          this.filteredUsers$$.value.map((u: User) => [
            u.firstname,
            u.lastname,
            u.email,
            u.telephone?.toString(),
            u.userType,
            Translate[StatusToName[+u.status]][this.selectedLang],
          ]),
          'users',
        );

        if (value !== 'PRINT') {
          this.notificationSvc.showNotification(Translate.DownloadSuccess(value)[this.selectedLang]);
        }
        setTimeout(() => {
          this.downloadDropdownControl.setValue('');
          // this.cdr.detectChanges();
        }, 0);

        this.downloadDropdownControl.setValue(null);

        this.cdr.detectChanges();
      });

    this.afterBannerClosed$$
      .pipe(
        map((value) => {
          if (value?.proceed) {
            return [...this.selectedUserIds.map((id) => ({ id: +id, status: value.newStatus as number }))];
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
      .subscribe((value) => {
        this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
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
      .subscribe((lang) => {
        this.selectedLang = lang;
        this.columns = [
          Translate.FirstName[lang],
          Translate.LastName[lang],
          Translate.Email[lang],
          Translate.Telephone[lang],
          Translate.Category[lang],
          Translate.Status[lang],
          Translate.Actions[lang],
        ];

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

  public handleCheckboxSelection(selected: string[]) {
    this.toggleMenu(true);
    this.selectedUserIds = [...selected];
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
          status.toLowerCase()?.includes(searchText)
        );
      }),
    ]);
  }

  public changeStatus(changes: ChangeStatusRequestData[]) {
    this.userApiSvc
      .changeUserStatus$(changes)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(
        () => this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]),
        (err) => this.notificationSvc.showNotification(err, NotificationType.DANGER),
      );
  }

  public deleteUser(id: number) {
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
        switchMap(() => this.userApiSvc.deleteStaff(id)),
        take(1),
      )
      .subscribe(() => {
        this.notificationSvc.showNotification(Translate.SuccessMessage.UserDeleted[this.selectedLang]);
      });
  }

  public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
    this.afterBannerClosed$$.next(e);
  }

  public copyToClipboard() {
    try {
      let dataString = `${this.columns.slice(0, -1).join('\t')}\n`;

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
      this.router.navigate([`./${e.id}/view`], { relativeTo: this.route });
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

    modalRef.closed.pipe(take(1)).subscribe((result) => this.filterUserList(result));
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

  public openAddUserModal(userDetails?: User) {
    this.modalSvc.open(AddUserComponent, {
      data: { edit: !!userDetails?.id, userDetails },
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
}
