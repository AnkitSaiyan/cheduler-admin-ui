import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationType, TableItem } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ChangeStatusRequestData, Status, StatusToName } from '../../../../shared/models/status.model';
import { getStatusEnum } from '../../../../shared/utils/getEnums';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { DownloadAsType, DownloadService, DownloadType } from '../../../../core/services/download.service';
import { Statuses } from '../../../../shared/utils/const';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { Exam } from '../../../../shared/models/exam.model';

@Component({
  selector: 'dfm-exam-list',
  templateUrl: './exam-list.component.html',
  styleUrls: ['./exam-list.component.scss'],
})
export class ExamListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  @HostListener('document:click', ['$event']) onClick() {
    this.toggleMenu(true);
  }

  @ViewChild('showMoreButtonIcon')
  private showMoreBtn!: ElementRef;

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['Name', 'Expensive', 'Status', 'Actions'];

  public downloadItems: DownloadType[] = [];

  private exams$$: BehaviorSubject<any[]>;

  public filteredExams$$: BehaviorSubject<any[]>;

  public clearSelected$$ = new Subject<void>();

  public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

  public selectedExamIDs: string[] = [];

  public statusType = getStatusEnum();

  constructor(
    private examApiSvc: ExamApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private downloadSvc: DownloadService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
    this.exams$$ = new BehaviorSubject<any[]>([]);
    this.filteredExams$$ = new BehaviorSubject<any[]>([]);
  }

  ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

    this.examApiSvc.exams$.pipe(takeUntil(this.destroy$$)).subscribe((exams) => {
      this.exams$$.next(exams);
      this.filteredExams$$.next(exams);
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
      if (searchText) {
        this.handleSearch(searchText.toLowerCase());
      } else {
        this.filteredExams$$.next([...this.exams$$.value]);
      }
    });

    this.downloadDropdownControl.valueChanges
      .pipe(
        filter((value) => !!value),
        takeUntil(this.destroy$$),
      )
      .subscribe((downloadAs) => {
        if (!this.exams$$.value.length) {
          this.notificationSvc.showNotification('No Exams found', NotificationType.INFO);
          return;
        }

        this.downloadSvc.downloadJsonAs(
          downloadAs as DownloadAsType,
          this.columns.slice(0, -1),
          this.exams$$.value.map((ex: Exam) => [ex.name, ex.expensive?.toString(), StatusToName[ex.status]]),
          'exams',
        );

        this.downloadDropdownControl.setValue('');
        this.cdr.detectChanges();
      });

    this.afterBannerClosed$$
      .pipe(
        map((value) => {
          if (value?.proceed) {
            return [...this.selectedExamIDs.map((id) => ({ id: +id, status: value.newStatus as number }))];
          }

          return [];
        }),
        filter((changes) => {
          if (!changes.length) {
            this.clearSelected$$.next();
          }
          return !!changes.length;
        }),
        switchMap((changes) => this.examApiSvc.changeExamStatus$(changes)),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => {
        this.notificationSvc.showNotification('Status has changed successfully');
        this.clearSelected$$.next();
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public handleCheckboxSelection(selected: string[]) {
    this.toggleMenu(true);
    this.selectedExamIDs = [...selected];
  }

  private handleSearch(searchText: string): void {
    this.filteredExams$$.next([
      ...this.exams$$.value.filter((exam) => {
        return (
          exam.name?.toLowerCase()?.includes(searchText) ||
          exam.lastname?.toLowerCase()?.includes(searchText) ||
          exam.email?.toLowerCase()?.includes(searchText) ||
          Statuses[+exam.status] === searchText
        );
      }),
    ]);
  }

  public changeStatus(changes: ChangeStatusRequestData[]) {
    this.examApiSvc
      .changeExamStatus$(changes)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => this.notificationSvc.showNotification('Status has changed successfully'));
  }

  public deleteExam(id: number) {
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Exam?',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    modalRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => this.examApiSvc.deleteExam(id)),
        take(1),
      )
      .subscribe(() => {
        this.notificationSvc.showNotification('Exam deleted successfully');
      });
  }

  public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
    this.afterBannerClosed$$.next(e);
  }

  public copyToClipboard() {
    this.notificationSvc.showNotification('Data copied to clipboard successfully');
  }

  public navigateToViewExam(e: TableItem) {
    if (e?.id) {
      this.router.navigate([`./${e.id}/view`], { relativeTo: this.route });
    }
  }

  public toggleMenu(reset = false) {
    const icon = document.querySelector('.ex-li-plus-btn-icon');
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
          ...this.exams$$.value.map(({ id, firstname, lastname, email, status }) => ({
            name: `${firstname} ${lastname}`,
            description: email,
            key: `${firstname} ${lastname} ${email} ${Statuses[+status]}`,
            value: id,
          })),
        ],
        placeHolder: 'Search by Exam Name',
      } as SearchModalData,
    });

    modalRef.closed.pipe(take(1)).subscribe((result) => this.filterExams(result));
  }

  private filterExams(result: { name: string; value: string }[]) {
    if (!result?.length) {
      this.filteredExams$$.next([...this.exams$$.value]);
      return;
    }

    const ids = new Set<number>();
    result.forEach((item) => ids.add(+item.value));
    this.filteredExams$$.next([...this.exams$$.value.filter((exam: Exam) => ids.has(+exam.id))]);
  }
}
