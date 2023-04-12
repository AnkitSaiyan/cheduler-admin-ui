import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, debounceTime, filter, map, Subject, switchMap, takeUntil } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { DownloadAsType, DownloadService } from '../../../../core/services/download.service';
import { EmailTemplateApiService } from 'src/app/core/services/email-template-api.service';
import { Status, StatusToName } from 'src/app/shared/models/status.model';
import { getStatusEnum, getUserTypeEnum } from 'src/app/shared/utils/getEnums';
import { Email } from 'src/app/shared/models/email-template.model';
import { Translate } from 'src/app/shared/models/translate.model';
import { ENG_BE, Statuses, StatusesNL, DUTCH_BE } from 'src/app/shared/utils/const';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { TranslateService } from '@ngx-translate/core';
import { PermissionService } from 'src/app/core/services/permission.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { UserRoleEnum } from 'src/app/shared/models/user.model';

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

  public columns: string[] = ['Title', 'Subject', 'Status'];

  public downloadItems: any[] = [];

  private emails$$: BehaviorSubject<any[]>;

  public filteredEmails$$: BehaviorSubject<any[]>;

  public clearSelected$$ = new Subject<void>();

  public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

  public selectedUserIds: string[] = [];

  public statusType = getStatusEnum();

  public userType = getUserTypeEnum();

  private selectedLang: string = ENG_BE;

  public statuses = Statuses;

  public readonly Permission = Permission;

  constructor(
    private notificationSvc: NotificationDataService,
    private downloadSvc: DownloadService,
    private emailTemplateApiSvc: EmailTemplateApiService,
    private cdr: ChangeDetectorRef,
    private shareDataSvc: ShareDataService,
    private translate: TranslateService,
    public permissionSvc: PermissionService,
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
          this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
          this.clearDownloadDropdown();
          return;
        }

        this.downloadSvc.downloadJsonAs(
          downloadAs as DownloadAsType,
          this.columns.slice(0, -1),
          this.filteredEmails$$.value.map((em: Email) => [em.title, em.subject?.toString(), StatusToName[em.status]]),
          'email-template',
        );

        if (downloadAs !== 'PRINT') {
          this.notificationSvc.showNotification(`${Translate.DownloadSuccess(downloadAs)[this.selectedLang]}`);
        }
        this.clearDownloadDropdown();
      });

    this.afterBannerClosed$$.pipe(
      map((value) => {
        if (value?.proceed) {
          return [...this.selectedUserIds.map((id) => ({ id: +id, newStatus: value.newStatus }))];
        }

        return [];
      }),
      takeUntil(this.destroy$$),
    );

    this.afterBannerClosed$$
      .pipe(
        map((value) => {
          if (value?.proceed) {
            return [...this.selectedUserIds.map((id) => ({ id: +id, status: value.newStatus as number }))];
          }

          return [];
        }),
        filter((changes) => {
          if (!changes.length) {
            this.clearSelected$$.next();
          }
          return !!changes.length;
        }),
        switchMap((changes) => this.emailTemplateApiSvc.changeEmailStatus$(changes)),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => {
        this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
        this.clearSelected$$.next();
      });

    combineLatest([this.shareDataSvc.getLanguage$(), this.permissionSvc.permissionType$])
      .pipe(takeUntil(this.destroy$$))
      .subscribe(([lang, permissionType]) => {
        this.selectedLang = lang;
        if (permissionType !== UserRoleEnum.Reader) {
          this.columns = [...this.columns, Translate.Actions[lang]];
        }

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

  public handleCheckboxSelection(selected: string[]) {
    this.toggleMenu(true);
    this.selectedUserIds = [...selected];
  }

  private handleSearch(searchText: string): void {
    this.filteredEmails$$.next([
      ...this.emails$$.value.filter((email) => {
        let status: any;
        if (email.status === 1) status = this.translate.instant('Active');
        if (email.status === 0) status = this.translate.instant('Inactive');

        return (
          email.title?.toLowerCase()?.includes(searchText) ||
          email.subject?.toLowerCase()?.includes(searchText) ||
          status?.toLowerCase()?.startsWith(searchText)
        );
      }),
    ]);
  }

  public changeStatus(changes: { id: number; status: number }[]) {
    this.emailTemplateApiSvc
      .changeEmailStatus$(changes)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]));
  }

  public handleConfirmation(e: { proceed: boolean; newStatus: Status | null }) {
    this.afterBannerClosed$$.next(e);
  }

  public copyToClipboard() {
    try {
      let dataString = `${this.columns.slice(0, -1).join('\t')}\n`;

      this.filteredEmails$$.value.forEach((email: Email) => {
        dataString += `${email.title}\t${email.subject}\t${StatusToName[email.status]}\n`;
      });

      this.clipboardData = dataString;

      this.cdr.detectChanges();
      this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
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
  private clearDownloadDropdown() {
    setTimeout(() => {
      this.downloadDropdownControl.setValue('');
    }, 0);
  }
}







