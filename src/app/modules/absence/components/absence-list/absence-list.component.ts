import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DfmDatasource, DfmTableHeader, NotificationType, TableItem } from 'diflexmo-angular-design';
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
import { ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { PermissionService } from 'src/app/core/services/permission.service';
import { PaginationData } from "../../../../shared/models/base-response.model";
import { GeneralUtils } from "../../../../shared/utils/general.utils";

const ColumnIdToKey = {
  1: 'name',
  2: 'startedAt',
  3: 'endedAt',
  4: 'info'
}

@Component({
  selector: 'dfm-absence-list',
  templateUrl: './absence-list.component.html',
  styleUrls: ['./absence-list.component.scss'],
})
export class AbsenceListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  @HostListener('document:click', ['$event']) onClick() {
    this.toggleMenu(true);
  }

  private absences$$: BehaviorSubject<Absence[]>;

  public filteredAbsences$$: BehaviorSubject<Absence[]>;

  public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
    items: [],
    isInitialLoading: true,
    isLoadingMore: false,
  });

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['Title', 'StartDate', 'EndDate', 'AbsenceInfo'];

  public tableHeaders: DfmTableHeader[] = [
    { id: '1', title: 'Title', isSortable: true },
    { id: '2', title: 'StartDate', isSortable: true },
    { id: '3', title: 'EndDate', isSortable: true },
    { id: '4', title: 'AbsenceInfo', isSortable: true },
  ];

  public downloadItems: DownloadType[] = [];

  private selectedLang: string = ENG_BE;

  public statuses = Statuses;

  public readonly Permission = Permission;

  public clipboardData: string = '';

  private paginationData: PaginationData | undefined;

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
    public permissionSvc: PermissionService,
  ) {
    super();
    this.absences$$ = new BehaviorSubject<any[]>([]);
    this.filteredAbsences$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: (items) => (this.downloadItems = items)
    });

    this.filteredAbsences$$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: (value) => {
        this.tableData$$.next({
          items: value,
          isInitialLoading: false,
          isLoading: false,
          isLoadingMore: false
        });
      }
    });

    this.absences$$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: (absences) => this.filteredAbsences$$.next([...absences])
    });

    this.absenceApiSvc.absences$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: (absencesBase) => {
        if (this.paginationData && this.paginationData.pageNo < absencesBase.metaData.pagination.pageNo) {
          this.absences$$.next([...this.absences$$.value, ...absencesBase.data]);
        } else {
          this.absences$$.next(absencesBase.data);
        }
        this.paginationData = absencesBase.metaData.pagination;
      },
      error: (e) => {
        this.absences$$.next([]);
      }
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe({
      next: (searchText) => {
        if (searchText) {
          this.handleSearch(searchText.toLowerCase());
        } else {
          this.filteredAbsences$$.next([...this.absences$$.value]);
        }
      }
    });

    this.downloadDropdownControl.valueChanges
      .pipe(
        filter((value) => !!value),
        takeUntil(this.destroy$$),
      )
      .subscribe({
        next: (value) => {
          if (!this.filteredAbsences$$.value.length) {
            this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
            this.clearDownloadDropdown();
            return;
          }
          this.downloadSvc.downloadJsonAs(
						value as DownloadAsType,
						this.tableHeaders.map(({ title }) => title),
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

          this.clearDownloadDropdown();
        }
      });

    this.shareDataSvc.getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe({
        next: (lang) => {
          this.selectedLang = lang;

          this.tableHeaders = this.tableHeaders.map((h, i) => ({
            ...h, title: Translate[this.columns[i]][lang]
          }));

          switch (lang) {
            case ENG_BE:
              this.statuses = Statuses;
              break;
            default:
              this.statuses = StatusesNL;
          }
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
      .subscribe({
        next: () => {
          this.notificationSvc.showNotification(Translate.SuccessMessage.AbsenceDeleted[this.selectedLang]);
          // filtering out deleted absence
          this.absences$$.next([...this.absences$$.value.filter((a) => +a.id !== +id)]);
        }
      });
  }

  public copyToClipboard() {
    try {
      let dataString = `${this.tableHeaders.map(({ title }) => title).join('\t')}\n`;

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
  private clearDownloadDropdown() {
    setTimeout(() => {
      this.downloadDropdownControl.setValue('');
    }, 0);
  }

  public onScroll(e: undefined): void {
    if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
      this.absenceApiSvc.pageNo = this.paginationData.pageNo + 1;
      this.tableData$$.value.isLoadingMore = true;
    }
  }

  public onSort(e: DfmTableHeader): void {
    this.filteredAbsences$$.next(GeneralUtils.SortArray(this.filteredAbsences$$.value, e.sort, ColumnIdToKey[e.id]));
  }
}
