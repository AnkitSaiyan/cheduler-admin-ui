import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, filter, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';
import { TableItem } from 'diflexmo-angular-design';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { getStatusEnum } from '../../../../shared/utils/getStatusEnum';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Status } from '../../../../shared/models/status';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { ModalService } from '../../../../core/services/modal.service';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { User } from '../../../../shared/models/user.model';

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

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['First Name', 'Last Name', 'Type', 'Email', 'Status', 'Actions'];

  public downloadItems: any[] = [
    {
      name: 'CSV',
      value: 'csv',
      description: 'Download as CSV',
    },
    {
      name: 'Excel',
      value: 'xls',
      description: 'Download as Excel',
    },
    {
      name: 'Pdf',
      value: 'pdf',
      description: 'Download as PDF',
    },
    {
      name: 'Print',
      value: 'print',
      description: 'Print appointments',
    },
  ];

  private staffs$$: BehaviorSubject<any[]>;

  public filteredStaffs$$: BehaviorSubject<any[]>;

  public clearSelected$$ = new Subject<void>();

  public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

  public selectedStaffIds: string[] = [];

  public statusType = getStatusEnum();

  constructor(
    private staffApiSvc: StaffApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
  ) {
    super();
    this.staffs$$ = new BehaviorSubject<any[]>([]);
    this.filteredStaffs$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
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
            return [...this.selectedStaffIds.map((id) => ({ id: +id, newStatus: value.newStatus }))];
          }

          return [];
        }),
        // TODO have to implement change status staff list
        // switchMap((changes) => this.staffApiSvc.changeStaffStatus$(changes)),
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
    this.selectedStaffIds = [...selected];
  }

  private handleSearch(searchText: string): void {
    this.filteredStaffs$$.next([
      ...this.staffs$$.value.filter((staff) => {
        return (
          staff.firstname?.toLowerCase()?.includes(searchText) ||
          staff.lastname?.toLowerCase()?.includes(searchText) ||
          staff.email?.toLowerCase()?.includes(searchText) ||
          staff.userType?.toLowerCase()?.includes(searchText)
        );
      }),
    ]);
  }

  public changeStatus(changes: { id: number | string; newStatus: Status | null }[]) {
    // this.staffApiSvc
    //   .changeStaffStatus$(changes)
    //   .pipe(takeUntil(this.destroy$$))
    //   .subscribe(() => this.notificationSvc.showNotification('Status has changed successfully'));
  }

  public deleteStaff(id: number) {
    const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Staff?',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    dialogRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(()=>this.staffApiSvc.deleteStaff(id)),
        take(1),
      )
      .subscribe((response) => {
        if (response) {
          
          this.notificationSvc.showNotification('Staff deleted successfully');
        }
      });
  }

  public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
    console.log(e);
    this.afterBannerClosed$$.next(e);
  }

  public copyToClipboard() {
    this.notificationSvc.showNotification('Data copied to clipboard successfully');
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
    console.log(result, this.staffs$$.value);
    if (!result?.length) {
      this.filteredStaffs$$.next([...this.staffs$$.value]);
      return;
    }

    const ids = new Set<number>();
    result.forEach((item) => ids.add(+item.value));
    this.filteredStaffs$$.next([...this.staffs$$.value.filter((staff: User) => ids.has(+staff.id))]);
  }
}
