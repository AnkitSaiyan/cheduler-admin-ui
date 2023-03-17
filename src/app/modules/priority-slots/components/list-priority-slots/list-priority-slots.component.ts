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
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { Absence } from '../../../../shared/models/absence.model';
import { AddPrioritySlotsComponent } from '../add-priority-slots/add-priority-slots.component';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
@Component({
  selector: 'dfm-list-priority-slots',
  templateUrl: './list-priority-slots.component.html',
  styleUrls: ['./list-priority-slots.component.scss'],
})
export class ListPrioritySlotsComponent extends DestroyableComponent implements OnInit, OnDestroy {
  clipboardData: string = '';
  @HostListener('document:click', ['$event']) onClick() {
    this.toggleMenu(true);
  }

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['Start', 'End', 'Priority', 'Actions'];

  public downloadItems: DownloadType[] = [];

  private prioritySlots$$: BehaviorSubject<any[]>;

  public filteredPrioritySlots$$: BehaviorSubject<any[]>;

  private selectedLang: string = ENG_BE;

  public statuses = Statuses;

  public calendarView$$ = new BehaviorSubject<boolean>(false);

  constructor(
    private priorityApiSvc: PrioritySlotApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private downloadSvc: DownloadService,
    private cdr: ChangeDetectorRef,
    private shareDataSvc: ShareDataService,
  ) {
    super();
    this.prioritySlots$$ = new BehaviorSubject<any[]>([]);
    this.filteredPrioritySlots$$ = new BehaviorSubject<any[]>([]);
  }

  ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

    this.route.queryParams.pipe(takeUntil(this.destroy$$)).subscribe((params) => {
      if (params['v']) {
        this.calendarView$$.next(params['v'] !== 't');
      } else {
        this.router.navigate([], {
          replaceUrl: true,
          queryParams: {
            v: 'w',
          },
        });
        this.calendarView$$.next(true);
      }
    });

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
          this.filteredPrioritySlots$$.value.map((pr: PrioritySlot) => [
            pr.startedAt,
            pr.endedAt ? pr.endedAt : `${pr.startedAt.slice(0, -9)}, ${pr.slotEndTime}`,
            pr.priority,
          ]),
          'priority slot details',
        );

        if (downloadAs !== 'PRINT') {
          this.notificationSvc.showNotification(`${Translate.DownloadSuccess(downloadAs)[this.selectedLang]}`);
        }

        this.downloadDropdownControl.setValue(null);

        this.cdr.detectChanges();
      });

    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => {
        this.selectedLang = lang;
        this.columns = [Translate.Start[lang], Translate.End[lang], Translate.Priority[lang], Translate.Actions[lang]];

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

  private handleSearch(searchText: string): void {
    this.filteredPrioritySlots$$.next([
      ...this.prioritySlots$$.value.filter((priority) => {
        return (
          priority.startedAt?.toLowerCase()?.includes(searchText) ||
          priority.endedAt?.toLowerCase()?.includes(searchText) ||
          priority.priority?.toLowerCase()?.includes(searchText)
        );
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
      } as ConfirmActionModalData,
    });

    modalRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => this.priorityApiSvc.deletePrioritySlot$(id)),
        take(1),
      )
      .subscribe((response) => {
        if (response) {
          this.notificationSvc.showNotification(Translate.SuccessMessage.Deleted[this.selectedLang]);
        }
      });
  }

  public copyToClipboard() {
    try {
      let dataString = `${this.columns.slice(0, -1).join('\t')}\n`;

      this.filteredPrioritySlots$$.value.forEach((prioritySlot: PrioritySlot) => {
        dataString += `${prioritySlot.startedAt}\t${prioritySlot.endedAt ? prioritySlot.endedAt : prioritySlot.startedAt.slice(0, -9)}\t${
          prioritySlot.priority
        }\n`;
      });

      this.clipboardData = dataString;

      this.cdr.detectChanges();
      this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
    } catch (e) {
      this.notificationSvc.showNotification(Translate.ErrorMessage.CopyToClipboard[this.selectedLang], NotificationType.DANGER);
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

  public toggleView(): void {
    this.router.navigate([], {
      replaceUrl: true,
      queryParams: {
        v: !this.calendarView$$.value ? 'w' : 't',
      },
    });
  }
}










