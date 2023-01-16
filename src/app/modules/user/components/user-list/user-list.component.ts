import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TableItem } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Status } from '../../../../shared/models/status';
import { getStatusEnum } from '../../../../shared/utils/getStatusEnum';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { User, UserType } from '../../../../shared/models/user.model';
import { DownloadService } from '../../../../core/services/download.service';
import { getUserTypeEnum } from '../../../../shared/utils/getUserTypeEnum';
import { AddUserComponent } from '../add-user/add-user.component';

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

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['First Name', 'Last Name', 'Email', 'Telephone', 'Category', 'Status', 'Actions'];

  public downloadItems: any[] = [];

  private users$$: BehaviorSubject<any[]>;

  public filteredUsers$$: BehaviorSubject<any[]>;

  public clearSelected$$ = new Subject<void>();

  public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

  public selectedUserIds: string[] = [];

  public statusType = getStatusEnum();

  public userType = getUserTypeEnum();

  constructor(
    private userApiSvc: StaffApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private downloadSvc: DownloadService,
  ) {
    super();
    this.users$$ = new BehaviorSubject<any[]>([]);
    this.filteredUsers$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((types) => {
      this.downloadItems = types;
    });

    this.userApiSvc.staffList$
      .pipe(
        map((users) => users.filter((user) => [UserType.Scheduler, UserType.Secretary, UserType.General].includes(user.userType))),
        takeUntil(this.destroy$$),
      )
      .subscribe((users) => {
        this.users$$.next(users);
        this.filteredUsers$$.next(users);
      });

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
        switch (value) {
          case 'print':
            this.notificationSvc.showNotification(`Data printed successfully`);
            break;
          default:
            this.notificationSvc.showNotification(`Download in ${value?.toUpperCase()} successfully`);
        }
      });

    this.afterBannerClosed$$
      .pipe(
        map((value) => {
          if (value?.proceed) {
            return [...this.selectedUserIds.map((id) => ({ id: +id, newStatus: value.newStatus }))];
          }

          return [];
        }),
        switchMap((changes) => this.userApiSvc.changeStaffStatus$(changes)),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => {
        if (value) {
          this.notificationSvc.showNotification('Status has changed successfully');
        }
        this.clearSelected$$.next();
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
        return (
          user.firstname?.toLowerCase()?.includes(searchText) || user.lastname?.toLowerCase()?.includes(searchText)
          // user.email?.toLowerCase()?.includes(searchText) ||
          // user.userType?.toLowerCase()?.includes(searchText)
        );
      }),
    ]);
  }

  public changeStatus(changes: { id: number | string; newStatus: Status | null }[]) {
    this.userApiSvc
      .changeStaffStatus$(changes)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => this.notificationSvc.showNotification('Status has changed successfully'));
  }

  public deleteUser(id: number) {
    const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this User?',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    dialogRef.closed
      .pipe(
        filter((res: boolean) => res),
        take(1),
      )
      .subscribe(() => {
        this.userApiSvc.deleteStaff(id);
        this.notificationSvc.showNotification('User deleted successfully');
      });
  }

  public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
    console.log(e);
    this.afterBannerClosed$$.next(e);
  }

  public copyToClipboard() {
    this.notificationSvc.showNotification('Data copied to clipboard successfully');
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
    console.log(result, this.users$$.value);
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
}
