import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TableItem } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { DownloadService } from '../../../../core/services/download.service';
import { EditEmailComponent } from '../edit-email/edit-email.component';
import { EmailTemplateApiService } from 'src/app/core/services/email-template-api.service';
import { Status } from 'src/app/shared/models/status.model';
import { getStatusEnum, getUserTypeEnum } from 'src/app/shared/utils/getEnums';

@Component({
  selector: 'dfm-email-list',
  templateUrl: './email-list.component.html',
  styleUrls: ['./email-list.component.scss'],
})
export class EmailListComponent extends DestroyableComponent implements OnInit, OnDestroy {
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
  ) {
    super();
    this.emails$$ = new BehaviorSubject<any[]>([]);
    this.filteredEmails$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((types) => {
      this.downloadItems = types;
    });

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
    this.notificationSvc.showNotification('Data copied to clipboard successfully');
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

