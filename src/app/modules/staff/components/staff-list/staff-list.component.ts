import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, filter, map, Subject, switchMap, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';
import { TableItem } from 'diflexmo-angular-design';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { getStatusEnum } from '../../../../shared/utils/getStatusEnum';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Status } from '../../../../shared/models/status';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ConfirmActionDialogComponent } from '../../../../shared/components/confirm-action-dialog.component';
import { ModalService } from '../../../../core/services/modal.service';

@Component({
  selector: 'dfm-staff-list',
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.scss'],
})
export class StaffListComponent extends DestroyableComponent implements OnInit, OnDestroy {
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

  public showBanner = false;

  public openedDialog!: NgbModalRef;

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
        filter((value) => !!value),
        map((value) => {
          console.log(value);
          if (value?.proceed) {
            return [...this.selectedStaffIds.map((id) => ({ id: +id, newStatus: value.newStatus }))];
          }

          return [];
        }),
        switchMap((changes) => this.staffApiSvc.changeStaffStatus$(changes)),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => {
        if (value) {
          this.notificationSvc.showNotification('Status has changed successfully');
          this.clearSelected$$.next();
        }
        this.showBanner = false;
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public handleCheckboxSelection(selected: string[]) {
    this.selectedStaffIds = [...selected];
  }

  private handleSearch(searchText: string): void {
    this.filteredStaffs$$.next([
      ...this.staffs$$.value.filter((staff) => {
        return staff.firstname?.toLowerCase()?.includes(searchText) || staff.lastname?.toLowerCase()?.includes(searchText);
      }),
    ]);
  }

  public changeStatus(changes: { id: number | string; newStatus: Status | null }[]) {
    this.staffApiSvc
      .changeStaffStatus$(changes)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => this.notificationSvc.showNotification('Status has changed successfully'));
  }

  public deleteStaff(id: number) {
    // this.modalSvc.open(ConfirmActionDialogComponent);
    this.openedDialog.dismissed.subscribe((data) => console.log(data));
    this.staffApiSvc.deleteStaff(id);
    this.notificationSvc.showNotification('Staff deleted successfully');
  }

  public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
    console.log(e);
    this.afterBannerClosed$$.next(e);
  }

  public openConfirmationBanner() {
    this.showBanner = true;
  }

  public handleCopyClick() {
    this.notificationSvc.showNotification('Data copied to clipboard successfully');
  }

  public navigateToViewStaff(e: TableItem) {
    if (e?.id) {
      this.router.navigate([`./${e.id}/view`], { relativeTo: this.route });
    }
  }

  public toggleMenu() {
    const icon = document.querySelector('.sf-li-plus-btn-icon');
    if (icon) {
      icon.classList.toggle('rotate-z-45');
      icon.classList.toggle('rotate-z-0');
    }
  }
}
