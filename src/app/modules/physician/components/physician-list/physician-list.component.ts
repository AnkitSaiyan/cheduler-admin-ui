import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, filter, interval, map, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { NotificationType, TableItem } from 'diflexmo-angular-design';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { ChangeStatusRequestData, Status, StatusToName } from '../../../../shared/models/status.model';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { getStatusEnum } from '../../../../shared/utils/getEnums';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { DownloadAsType, DownloadService } from '../../../../core/services/download.service';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Statuses } from '../../../../shared/utils/const';
import { Physician } from '../../../../shared/models/physician.model';
import { PhysicianAddComponent } from '../physician-add/physician-add.component';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'dfm-physician-list',
  templateUrl: './physician-list.component.html',
  styleUrls: ['./physician-list.component.scss'],
})
export class PhysicianListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  clipboardData: string = '';

  @HostListener('document:click', ['$event']) onClick() {
    this.toggleMenu(true);
  }

  @ViewChild('showMoreButtonIcon') private showMoreBtn!: ElementRef;

  @ViewChild('optionsMenu') private optionMenu!: NgbDropdown;

  // @ViewChild('actionsMenuButton') private actionsMenuButton!: ButtonComponent;

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['FirstName', 'LastName', 'Email', 'Status', 'Actions'];

  public downloadItems: any[] = [];

  private physicians$$: BehaviorSubject<any[]>;

  public filteredPhysicians$$: BehaviorSubject<any[]>;

  public clearSelected$$ = new Subject<void>();

  public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

  public selectedPhysicianIDs: string[] = [];

  public statusType = getStatusEnum();

  public loading$$ = new BehaviorSubject(true);

  constructor(
    private physicianApiSvc: PhysicianApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private downloadSvc: DownloadService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
    this.physicians$$ = new BehaviorSubject<any[]>([]);
    this.filteredPhysicians$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

    this.physicianApiSvc.physicians$
      .pipe(
        tap(() => this.loading$$.next(true)),
        takeUntil(this.destroy$$),
      )
      .subscribe((physicians) => {
        this.physicians$$.next(physicians);
        this.filteredPhysicians$$.next(physicians);
        this.loading$$.next(false);
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
        if (!this.filteredPhysicians$$.value.length) {
          return;
        }

        this.downloadSvc.downloadJsonAs(
          value as DownloadAsType,
          this.columns.slice(0, -1),
          this.filteredPhysicians$$.value.map((u: User) => [u.firstname, u.lastname, u.userType, u.email, StatusToName[+u.status]]),
          'physician',
        );

        if (value !== 'PRINT') {
          this.notificationSvc.showNotification(`${value} file downloaded successfully`);
        }

        this.downloadDropdownControl.setValue(null);

        this.cdr.detectChanges();
      });

    this.afterBannerClosed$$
      .pipe(
        map((value) => {
          if (value?.proceed) {
            return [...this.selectedPhysicianIDs.map((id) => ({ id: +id, status: value.newStatus as number }))];
          }
          return [];
        }),
        filter((changes) => {
          if (!changes.length) {
            this.clearSelected$$.next();
          }
          return !!changes.length;
        }),
        switchMap((changes) => this.physicianApiSvc.changePhysicianStatus$(changes)),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => {
        this.notificationSvc.showNotification('Status has changed successfully');
        this.clearSelected$$.next();
      });

    interval(0)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.closeMenus();
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

  public changeStatus(changes: ChangeStatusRequestData[]) {
    this.physicianApiSvc
      .changePhysicianStatus$(changes)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(
        () => this.notificationSvc.showNotification('Status has changed successfully'),
        (err) => this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER),
      );
  }

  public deletePhysician(id: number) {
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'AreyousureyouwanttodeletethisPhysician',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    modalRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => this.physicianApiSvc.deletePhysician(id)),
        take(1),
      )
      .subscribe((response) => {
        if (response) {
          this.notificationSvc.showNotification('Physician deleted successfully');
        }
      });
  }

  public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
    this.afterBannerClosed$$.next(e);
  }

  public copyToClipboard() {
    try {
      let dataString = `${this.columns.slice(0, -1).join('\t')}\n`;

      this.filteredPhysicians$$.value.forEach((physician: Physician) => {
        dataString += `${physician.firstname}\t${physician.lastname}\t ${physician.email}\t ${StatusToName[+physician.status]}\n`;
      });

      this.clipboardData = dataString;

      this.cdr.detectChanges();
      this.notificationSvc.showNotification('Data copied to clipboard successfully');
    } catch (e) {
      this.notificationSvc.showNotification('Failed to copy Data', NotificationType.DANGER);
      this.clipboardData = '';
    }
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

  private closeMenus() {
    if (window.innerWidth >= 680) {
      if (this.optionMenu && this.optionMenu.isOpen()) {
        this.optionMenu.close();
        this.toggleMenu(true);
      }
    }
  }
}
