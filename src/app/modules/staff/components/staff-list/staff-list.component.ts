import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, debounceTime, filter, map, Subject, switchMap, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { getStatusEnum } from '../../../../shared/utils/getStatusEnum';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Status } from '../../../../shared/models/status';

@Component({
  selector: 'dfm-staff-list',
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.scss'],
})
export class StaffListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['First Name', 'Last Name', 'Type', 'Email', 'Status', 'Actions'];

  public downloadItems: any[] = [
    {
      name: 'Excel',
      value: 'xls',
      description: 'Download as Excel',
    },
    {
      name: 'PDF',
      value: 'pdf',
      description: 'Download as PDF',
    },
    {
      name: 'CSV',
      value: 'csv',
      description: 'Download as CSV',
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

  constructor(private staffApiSvc: StaffApiService) {
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

    // this.downloadDropdownControl.valueChanges
    //   .pipe(
    //     filter((value) => !!value && !this.downloadTypeSelected),
    //     takeUntil(this.destroy$$),
    //   )
    //   .subscribe(() => {
    //     this.downloadTypeSelected = true;
    //   });

    this.afterBannerClosed$$
      .pipe(
        filter((value) => !!value),
        map((value) => {
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
    this.staffApiSvc.changeStaffStatus$(changes).pipe(takeUntil(this.destroy$$)).subscribe();
  }

  public deleteStaff(id: number) {
    this.staffApiSvc.deleteStaff(id);
  }

  public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
    this.afterBannerClosed$$.next(e);
  }

  public openConfirmationBanner() {
    this.showBanner = true;
  }
}
