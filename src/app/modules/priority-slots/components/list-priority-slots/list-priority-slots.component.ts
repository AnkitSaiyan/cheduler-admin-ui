import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationType, TableItem } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { AbsenceApiService } from '../../../../core/services/absence-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { DownloadAsType, DownloadService, DownloadType } from '../../../../core/services/download.service';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { Absence } from '../../../../shared/models/absence.model';
import { AddPrioritySlotsComponent } from '../add-priority-slots/add-priority-slots.component';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
@Component({
  selector: 'dfm-list-priority-slots',
  templateUrl: './list-priority-slots.component.html',
  styleUrls: ['./list-priority-slots.component.scss']
})
export class ListPrioritySlotsComponent extends DestroyableComponent implements OnInit, OnDestroy {
  clipboardData: string = '';
  @HostListener('document:click', ['$event']) onClick() {
    this.toggleMenu(true);
  }

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['Start Date', 'End Date', 'Priority', 'Actions'];

  public downloadItems: DownloadType[] = [];

  private prioritySlots$$: BehaviorSubject<any[]>;

  public filteredPrioritySlots$$: BehaviorSubject<any[]>;

  constructor(
    private priorityApiSvc: PrioritySlotApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private downloadSvc: DownloadService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
    this.prioritySlots$$ = new BehaviorSubject<any[]>([]);
    this.filteredPrioritySlots$$ = new BehaviorSubject<any[]>([]);
  }

  ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

    this.priorityApiSvc.prioritySlots$.pipe(takeUntil(this.destroy$$)).subscribe((prioritySlots) => {
      this.prioritySlots$$.next(prioritySlots);
      this.filteredPrioritySlots$$.next(prioritySlots);
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
      if (searchText) {
        this.handleSearch(searchText.toLowerCase());
      } else {
        this.filteredPrioritySlots$$.next([...this.prioritySlots$$.value]);
      }
    });

    this.downloadDropdownControl.valueChanges
      .pipe(
        filter((value) => !!value),
        takeUntil(this.destroy$$),
      )
      .subscribe((downloadAs) => {
        if (!this.filteredPrioritySlots$$.value.length) {
          return;
        }

        this.downloadSvc.downloadJsonAs(
          downloadAs as DownloadAsType,
          this.columns.slice(0, -1),
          this.filteredPrioritySlots$$.value.map((pr: PrioritySlot) => [pr.startedAt, String(pr.endedAt), pr.priority]),
          'priority slot details',
        );

        if (downloadAs !== 'PRINT') {
          this.notificationSvc.showNotification(`${downloadAs} file downloaded successfully`);
        }

        this.downloadDropdownControl.setValue(null);

        this.cdr.detectChanges();
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  private handleSearch(searchText: string): void {
    this.filteredPrioritySlots$$.next([
      ...this.prioritySlots$$.value.filter((priority) => {
        return priority.startedAt?.toLowerCase()?.includes(searchText) || priority.endedAt?.toLowerCase()?.includes(searchText) || priority.priority?.toLowerCase()?.includes(searchText);
      }),
    ]);
  }

  public deletePrioritySlot(id: number) {
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Priority Slot?',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    modalRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(()=>this.priorityApiSvc.deletePrioritySlot$(id)),
        take(1),
      )
      .subscribe((response) => {
        if (response) {
          this.notificationSvc.showNotification('Priority Slot deleted successfully');
        }
      });
  }

  public copyToClipboard() {
    try {
      let dataString = `${this.columns.slice(0, -1).join('\t')}\n`;

      this.filteredPrioritySlots$$.value.forEach((prioritySlot: PrioritySlot) => {
        dataString += `${prioritySlot.startedAt}\t${prioritySlot.endedAt}\t${prioritySlot.priority}\n`;
      });

      this.clipboardData = dataString;

      this.cdr.detectChanges();
      this.notificationSvc.showNotification('Data copied to clipboard successfully');
    } catch (e) {
      this.notificationSvc.showNotification('Failed to copy Data', NotificationType.DANGER);
      this.clipboardData = '';
    }
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

  // public openSearchModal() {
  //   this.toggleMenu();

  //   const modalRef = this.modalSvc.open(SearchModalComponent, {
  //     options: { fullscreen: true },
  //     data: {
  //       items: [
  //         ...this.prioritySlots$$.value.map(({ id, name }) => ({
  //           name: `${name}`,
  //           key: `${name}`,
  //           value: id,
  //         })),
  //       ],
  //       placeHolder: 'Search by Absence Name',
  //     } as SearchModalData,
  //   });

  //   modalRef.closed.pipe(take(1)).subscribe((result) => this.filterAbsence(result));
  // }

  // private filterAbsence(result: { name: string; value: string }[]) {
  //   if (!result?.length) {
  //     this.filteredPrioritySlots$$.next([...this.prioritySlots$$.value]);
  //     return;
  //   }

  //   const ids = new Set<number>();
  //   result.forEach((item) => ids.add(+item.value));
  //   this.filteredPrioritySlots$$.next([...this.prioritySlots$$.value.filter((absence: Absence) => ids.has(+absence.id))]);
  // }

  public openAddPriorityModal(prioritySlotDetails?: PrioritySlot) {
    this.modalSvc.open(AddPrioritySlotsComponent, {
      data: { edit: !!prioritySlotDetails?.id, prioritySlotDetails },
      options: {
        size: 'xl',
        centered: true,
        backdropClass: 'modal-backdrop-remove-mv',
        keyboard: false,
      },
    });
  }
}
