import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationType, TableItem } from 'diflexmo-angular-design';
import { DatePipe } from '@angular/common';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { AbsenceApiService } from '../../../../core/services/absence-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { DownloadAsType, DownloadService, DownloadType } from '../../../../core/services/download.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { Absence } from '../../../../shared/models/absence.model';
import { AddAbsenceComponent } from '../add-absence/add-absence.component';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';

@Component({
  selector: 'dfm-absence-list',
  templateUrl: './absence-list.component.html',
  styleUrls: ['./absence-list.component.scss'],
})
export class AbsenceListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  clipboardData: string = '';

  @HostListener('document:click', ['$event']) onClick() {
    this.toggleMenu(true);
  }

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['Title', 'StartDate', 'EndDate', 'AbsenceInfo', 'Actions'];

  public downloadItems: DownloadType[] = [];

  private absences$$: BehaviorSubject<any[]>;

  public filteredAbsences$$: BehaviorSubject<any[]>;

  private selectedLang: string = ENG_BE;

  public statuses = Statuses;

  constructor(
    private absenceApiSvc: AbsenceApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private downloadSvc: DownloadService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private shareDataSvc: ShareDataService,
  ) {
    super();
    this.absences$$ = new BehaviorSubject<any[]>([]);
    this.filteredAbsences$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
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
        if (!this.filteredAbsences$$.value.length) {
          return;
        }
        this.downloadSvc.downloadJsonAs(
          value as DownloadAsType,
          this.columns.slice(0, -1),
          this.filteredAbsences$$.value.map((u: Absence) => [
            u.name,
            u.startedAt ? `${new Date(u?.startedAt)?.toDateString()} ${new Date(u?.startedAt)?.toLocaleTimeString()}` : '',
            u.endedAt ? `${new Date(u?.endedAt)?.toDateString()} ${new Date(u?.endedAt)?.toLocaleTimeString()}` : '',
            u.info,
          ]),
          'absences',
        );

        if (value !== 'PRINT') {
          this.notificationSvc.showNotification(`${Translate.DownloadSuccess(value)[this.selectedLang]}`);
        }

        setTimeout(() => {
          this.downloadDropdownControl.setValue('');
          // this.cdr.detectChanges();
        }, 0);
      });

    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => {
        this.selectedLang = lang;

        this.columns = [
          Translate.Title[lang],
          Translate.StartDate[lang],
          Translate.EndDate[lang],
          Translate.AbsenceInfo[lang],
          Translate.Actions[lang],
        ];

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
    this.filteredAbsences$$.next([
      ...this.absences$$.value.filter((absence: Absence) => {
        return (
          absence.name?.toLowerCase()?.includes(searchText) ||
          this.datePipe.transform(absence?.startedAt, 'dd/MM/yyyy, HH:mm')?.includes(searchText) ||
          this.datePipe.transform(absence?.endedAt, 'dd/MM/yyyy, HH:mm')?.includes(searchText)
        );
      }),
    ]);
  }

  public deleteAbsence(id: number) {
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'AreyousureyouwanttodeletethisAbsence',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as ConfirmActionModalData,
    });

    modalRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => this.absenceApiSvc.deleteAbsence$(id)),
        take(1),
      )
      .subscribe((res) => {
        this.notificationSvc.showNotification(Translate.SuccessMessage.AbsenceDeleted[this.selectedLang]);
      });
  }

  public copyToClipboard() {
    try {
      let dataString = `${this.columns.slice(0, -1).join('\t')}\n`;

      this.filteredAbsences$$.value.forEach((absence: Absence) => {
        dataString += `${absence.name}\t${absence?.startedAt}\t${absence.endedAt}\t${absence.info}\n`;
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
      data: { edit: !!absenceDetails?.id, absenceID: absenceDetails?.id },
      options: {
        size: 'xl',
        centered: true,
        backdropClass: 'modal-backdrop-remove-mv',
        keyboard: false,
      },
    });
  }
}
