import {ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {BehaviorSubject, debounceTime, filter, map, Subject, takeUntil} from 'rxjs';
import {NotificationType} from 'diflexmo-angular-design';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {DownloadAsType, DownloadService} from '../../../../core/services/download.service';
import {EmailTemplateApiService} from 'src/app/core/services/email-template-api.service';
import {Status, StatusToName} from 'src/app/shared/models/status.model';
import {getStatusEnum, getUserTypeEnum} from 'src/app/shared/utils/getEnums';
import {Email} from 'src/app/shared/models/email-template.model';

@Component({
  selector: 'dfm-email-template-list',
  templateUrl: './email-template-list.component.html',
  styleUrls: ['./email-template-list.component.scss'],
})
export class EmailTemplateListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  clipboardData: string = '';
  @HostListener('document:click', ['$event']) onClick() {
    this.toggleMenu(true);
  }

  @ViewChild('showMoreButtonIcon') private showMoreBtn!: ElementRef;

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['Title', 'Subject', 'Status', 'Actions'];

  public downloadItems: any[] = [];

  private emails$$: BehaviorSubject<any[]>;

  public filteredEmails$$: BehaviorSubject<any[]>;

  public clearSelected$$ = new Subject<void>();

  public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

  public selectedUserIds: string[] = [];

  public statusType = getStatusEnum();

  public userType = getUserTypeEnum();

  constructor(
    private notificationSvc: NotificationDataService,
    private downloadSvc: DownloadService,
    private emailTemplateApiSvc: EmailTemplateApiService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
    this.emails$$ = new BehaviorSubject<any[]>([]);
    this.filteredEmails$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));


    this.emailTemplateApiSvc.emailTemplates$.pipe(takeUntil(this.destroy$$)).subscribe((emails) => {
      this.emails$$.next(emails);
      this.filteredEmails$$.next(emails);
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
      if (searchText) {
        this.handleSearch(searchText.toLowerCase());
      } else {
        this.filteredEmails$$.next([...this.emails$$.value]);
      }
    });

    this.downloadDropdownControl.valueChanges
    .pipe(
      filter((value) => !!value),
      takeUntil(this.destroy$$),
    )
    .subscribe((downloadAs) => {
      if (!this.filteredEmails$$.value.length) {
        return;
      }

      this.downloadSvc.downloadJsonAs(
        downloadAs as DownloadAsType,
        this.columns.slice(0, -1),
        this.filteredEmails$$.value.map((em: Email) => [em.title, em.subject?.toString(), StatusToName[em.status]]),
        'exams',
      );

      if (downloadAs !== 'PRINT') {
        this.notificationSvc.showNotification(`${downloadAs} file downloaded successfully`);
      }

      this.downloadDropdownControl.setValue(null);

      this.cdr.detectChanges();
    });

    this.afterBannerClosed$$
      .pipe(
        map((value) => {
          if (value?.proceed) {
            return [...this.selectedUserIds.map((id) => ({ id: +id, newStatus: value.newStatus }))];
          }

          return [];
        }),
        takeUntil(this.destroy$$),
      )
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public handleCheckboxSelection(selected: string[]) {
    this.toggleMenu(true);
    this.selectedUserIds = [...selected];
  }

  private handleSearch(searchText: string): void {
    this.filteredEmails$$.next([
      ...this.emails$$.value.filter((email) => {
        return email.title?.toLowerCase()?.includes(searchText) || email.subject?.toLowerCase()?.includes(searchText);
      }),
    ]);
  }

  public changeStatus(changes: { id: number | string; newStatus: Status | null }[]) {}

  public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
    console.log(e);
    this.afterBannerClosed$$.next(e);
  }

  public copyToClipboard() {
    try {
      let dataString = `${this.columns.slice(0, -1).join('\t')}\n`;

      this.filteredEmails$$.value.forEach((email: Email) => {
        console.log('email-template: ', email);
        dataString += `${email.title}\t${email.subject}\t${StatusToName[email.status]}\n`;
      });

      this.clipboardData = dataString;

      this.cdr.detectChanges();
      this.notificationSvc.showNotification('Data copied to clipboard successfully');
    } catch (e) {
      this.notificationSvc.showNotification('Failed to copy Data', NotificationType.DANGER);
      this.clipboardData = '';
    }
  }

  public toggleMenu(reset = false) {
    const icon = document.querySelector('.us-li-plus-btn-icon');
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
}

