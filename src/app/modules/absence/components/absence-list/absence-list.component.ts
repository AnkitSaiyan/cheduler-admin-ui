import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TableItem } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { AbsenceApiService } from '../../../../core/services/absence-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { DownloadService } from '../../../../core/services/download.service';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { Absence } from '../../../../shared/models/absence.model';
import { AddAbsenceComponent } from '../add-absence/add-absence.component';

@Component({
  selector: 'dfm-absence-list',
  templateUrl: './absence-list.component.html',
  styleUrls: ['./absence-list.component.scss'],
})
export class AbsenceListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  @HostListener('document:click', ['$event']) onClick() {
    this.toggleMenu(true);
  }

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['Name', 'Start Date', 'End Date', 'Absence Info', 'Actions'];

  public downloadItems: any[] = [];

  private absences$$: BehaviorSubject<any[]>;

  public filteredAbsences$$: BehaviorSubject<any[]>;

  constructor(
    private absenceApiSvc: AbsenceApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private downloadSvc: DownloadService,
  ) {
    super();
    this.absences$$ = new BehaviorSubject<any[]>([]);
    this.filteredAbsences$$ = new BehaviorSubject<any[]>([]);
  }

  ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

    this.absenceApiSvc.absences$.pipe(takeUntil(this.destroy$$)).subscribe((absences) => {
      this.absences$$.next(absences);
      this.filteredAbsences$$.next(absences);
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
      if (searchText) {
        this.handleSearch(searchText.toLowerCase());
      } else {
        this.filteredAbsences$$.next([...this.absences$$.value]);
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
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  private handleSearch(searchText: string): void {
    this.filteredAbsences$$.next([
      ...this.absences$$.value.filter((absence) => {
        return absence.name?.toLowerCase()?.includes(searchText);
      }),
    ]);
  }

  public deleteAbsence(id: number) {
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Absence?',
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
        this.absenceApiSvc.deleteAbsence(id);
        this.notificationSvc.showNotification('Absence deleted successfully');
      });
  }

  public copyToClipboard() {
    this.notificationSvc.showNotification('Data copied to clipboard successfully');
  }

  public navigateToViewAbsence(e: TableItem) {
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
          ...this.absences$$.value.map(({ id, name }) => ({
            name: `${name}`,
            key: `${name}`,
            value: id,
          })),
        ],
        placeHolder: 'Search by Absence Name',
      } as SearchModalData,
    });

    modalRef.closed.pipe(take(1)).subscribe((result) => this.filterAbsence(result));
  }

  private filterAbsence(result: { name: string; value: string }[]) {
    if (!result?.length) {
      this.filteredAbsences$$.next([...this.absences$$.value]);
      return;
    }

    const ids = new Set<number>();
    result.forEach((item) => ids.add(+item.value));
    this.filteredAbsences$$.next([...this.absences$$.value.filter((absence: Absence) => ids.has(+absence.id))]);
  }

  public openAddAbsenceModal(absenceDetails?: Absence) {
    this.modalSvc.open(AddAbsenceComponent, {
      data: { edit: !!absenceDetails?.id, absenceDetails },
      options: {
        size: 'xl',
        centered: true,
        backdropClass: 'modal-backdrop-remove-mv',
        keyboard: false,
      },
    });
  }
}
