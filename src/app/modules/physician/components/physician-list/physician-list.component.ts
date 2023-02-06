import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, filter, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { TableItem } from 'diflexmo-angular-design';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Status } from '../../../../shared/models/status';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { getStatusEnum } from '../../../../shared/utils/getStatusEnum';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { DownloadService } from '../../../../core/services/download.service';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Statuses } from '../../../../shared/utils/const';
import { Physician } from '../../../../shared/models/physician.model';
import { PhysicianAddComponent } from '../physician-add/physician-add.component';

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

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['First Name', 'Last Name', 'Email', 'Status', 'Actions'];

  public downloadItems: any[] = [];

  private physicians$$: BehaviorSubject<any[]>;

  public filteredPhysicians$$: BehaviorSubject<any[]>;

  public clearSelected$$ = new Subject<void>();

  public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

  public selectedPhysicianIDs: string[] = [];

  public statusType = getStatusEnum();

  constructor(
    private physicianApiSvc: PhysicianApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private downloadSvc: DownloadService,
  ) {
    super();
    this.physicians$$ = new BehaviorSubject<any[]>([]);
    this.filteredPhysicians$$ = new BehaviorSubject<any[]>([]);
  }

  ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

    this.physicianApiSvc.physicians$.pipe(takeUntil(this.destroy$$)).subscribe((physicians) => {
      this.physicians$$.next(physicians);
      this.filteredPhysicians$$.next(physicians);
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
      if (searchText) {
        this.handleSearch(searchText.toLowerCase());
      } else {
        this.filteredPhysicians$$.next([...this.physicians$$.value]);
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
            return [...this.selectedPhysicianIDs.map((id) => ({ id: +id, newStatus: value.newStatus }))];
          }

          return [];
        }),
        switchMap((changes) => this.physicianApiSvc.changePhysicianStatus$(changes)),
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
    this.selectedPhysicianIDs = [...selected];
  }

  private handleSearch(searchText: string): void {
    this.filteredPhysicians$$.next([
      ...this.physicians$$.value.filter((physician) => {
        return (
          physician.firstname?.toLowerCase()?.includes(searchText) ||
          physician.lastname?.toLowerCase()?.includes(searchText) ||
          physician.email?.toLowerCase()?.includes(searchText) ||
          Statuses[+physician.status] === searchText
        );
      }),
    ]);
  }

  public changeStatus(changes: { id: number | string; newStatus: Status | null }[]) {
    this.physicianApiSvc
      .changePhysicianStatus$(changes)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => this.notificationSvc.showNotification('Status has changed successfully'));
  }

  public deletePhysician(id: number) {
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Physician?',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    modalRef.closed
      .pipe(
        filter((res: boolean) => res),
        take(1),
      )
      .subscribe(() => {
        this.physicianApiSvc.deletePhysician(id);
        this.notificationSvc.showNotification('Physician deleted successfully');
      });
  }

  public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
    this.afterBannerClosed$$.next(e);
  }

  public copyToClipboard() {
    this.notificationSvc.showNotification('Data copied to clipboard successfully');
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

    modalRef.closed.pipe(take(1)).subscribe((result) => this.filterPhysicians(result));
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
}
