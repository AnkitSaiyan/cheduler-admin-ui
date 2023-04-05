import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, filter, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';
import { NotificationType, TableItem } from 'diflexmo-angular-design';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { getStatusEnum } from '../../../../shared/utils/getEnums';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ChangeStatusRequestData, Status, StatusToName } from '../../../../shared/models/status.model';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { ModalService } from '../../../../core/services/modal.service';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { User, UserRoleEnum } from '../../../../shared/models/user.model';
import { DownloadAsType, DownloadService, DownloadType } from '../../../../core/services/download.service';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { TranslateService } from '@ngx-translate/core';
import { Permission } from 'src/app/shared/models/permission.model';
import { PermissionService } from 'src/app/core/services/permission.service';

@Component({
  selector: 'dfm-staff-list',
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.scss'],
})
export class StaffListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  clipboardData: string = '';

  @HostListener('document:click', ['$event']) onClick() {
    this.toggleMenu(true);
  }

  @ViewChild('showMoreButtonIcon') private showMoreBtn!: ElementRef;

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['FirstName', 'LastName', 'Type', 'Email', 'Status', 'Actions'];

  public downloadItems: DownloadType[] = [];

  private staffs$$: BehaviorSubject<any[]>;

  public filteredStaffs$$: BehaviorSubject<any[]>;

  public clearSelected$$ = new Subject<void>();

  public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

  public selectedStaffIds: string[] = [];

  public statusType = getStatusEnum();

  private selectedLang: string = ENG_BE;

  public statuses = Statuses;

  public readonly Permission = Permission;

  constructor(
    private staffApiSvc: StaffApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private downloadSvc: DownloadService,
    private cdr: ChangeDetectorRef,
    private shareDataSvc: ShareDataService,
    private translate: TranslateService,
    public permissionSvc: PermissionService,
  ) {
    super();
    this.staffs$$ = new BehaviorSubject<any[]>([]);
    this.filteredStaffs$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((types) => {
      this.downloadItems = types;
    });

    this.staffApiSvc.staffList$.pipe(takeUntil(this.destroy$$)).subscribe((staffs) => {
      this.staffs$$.next(staffs);
      this.filteredStaffs$$.next(staffs);
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
      if (searchText) {
        this.handleSearch(searchText.toLowerCase());
      } else {
        this.filteredStaffs$$.next([...this.staffs$$.value]);
      }
    });

    this.downloadDropdownControl.valueChanges
      .pipe(
        filter((value) => !!value),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => {
        if (!this.filteredStaffs$$.value.length) {
          this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
          this.clearDownloadDropdown();
          return;
        }

        this.downloadSvc.downloadJsonAs(
          value as DownloadAsType,
          this.columns.slice(0, -1),
          this.filteredStaffs$$.value.map((u: User) => [
            u.firstname,
            u.lastname,
            u.userType,
            u.email,
            Translate[StatusToName[+u.status]][this.selectedLang],
          ]),
          'staffs',
        );

        if (value !== 'PRINT') {
          this.notificationSvc.showNotification(Translate.DownloadSuccess(value)[this.selectedLang]);
        }
        this.clearDownloadDropdown();
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
        switchMap((changes) => this.staffApiSvc.changeUserStatus$(changes)),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => {
        this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
        this.clearSelected$$.next();
      });

    combineLatest([this.shareDataSvc.getLanguage$(), this.permissionSvc.permissionType$])
      .pipe(takeUntil(this.destroy$$))
      .subscribe(([lang, permissionType]) => {
        this.selectedLang = lang;
        this.columns = [Translate.FirstName[lang], Translate.LastName[lang], Translate.Type[lang], Translate.Email[lang], Translate.Status[lang]];
        if (permissionType !== UserRoleEnum.Reader) {
          this.columns = [...this.columns, Translate.Actions[lang]];
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
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public handleCheckboxSelection(selected: string[]) {
    this.toggleMenu(true);
    this.selectedStaffIds = [...selected];
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

  public changeStatus(changes: ChangeStatusRequestData[]) {
    this.staffApiSvc
      .changeUserStatus$(changes)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(
        () => this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]),
        (err) => this.notificationSvc.showNotification(err, NotificationType.DANGER),
      );
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
        switchMap(() => this.staffApiSvc.deleteStaff(id)),
        take(1),
      )
      .subscribe((response) => {
        if (response) {
          this.notificationSvc.showNotification(Translate.SuccessMessage.StaffDeleted[this.selectedLang]);
        }
      });
  }

  public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
    this.afterBannerClosed$$.next(e);
  }

  public copyToClipboard() {
    try {
      let dataString = `${this.columns.slice(0, -1).join('\t')}\n`;

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

    modalRef.closed.pipe(take(1)).subscribe((result) => this.filterStaffList(result));
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
}
