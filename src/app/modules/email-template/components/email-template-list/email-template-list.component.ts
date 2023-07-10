import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, debounceTime, filter, map, Subject, switchMap, takeUntil } from 'rxjs';
import { DfmDatasource, DfmTableHeader, NotificationType } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { DownloadAsType, DownloadService } from '../../../../core/services/download.service';
import { EmailTemplateApiService } from 'src/app/core/services/email-template-api.service';
import { Status, StatusToName } from 'src/app/shared/models/status.model';
import { getStatusEnum, getUserTypeEnum } from 'src/app/shared/utils/getEnums';
import { Email } from 'src/app/shared/models/email-template.model';
import { Translate } from 'src/app/shared/models/translate.model';
import { ENG_BE, Statuses, StatusesNL } from 'src/app/shared/utils/const';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

import { PermissionService } from 'src/app/core/services/permission.service';
import { Permission } from 'src/app/shared/models/permission.model';
import {PaginationData} from "../../../../shared/models/base-response.model";
import {GeneralUtils} from "../../../../shared/utils/general.utils";
import { ActivatedRoute, Router } from '@angular/router';

const ColumnIdToKey = {
	1: 'title',
	2: 'subject',
	3: 'status',
};

@Component({
	selector: 'dfm-email-template-list',
	templateUrl: './email-template-list.component.html',
	styleUrls: ['./email-template-list.component.scss'],
})
export class EmailTemplateListComponent extends DestroyableComponent implements OnInit, OnDestroy {
	@HostListener('document:click', ['$event']) onClick() {
		this.toggleMenu(true);
	}

	@ViewChild('showMoreButtonIcon') private showMoreBtn!: ElementRef;

	private emails$$: BehaviorSubject<Email[]>;

	public filteredEmails$$: BehaviorSubject<Email[]>;

	public clearSelected$$ = new Subject<void>();

	public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public searchControl = new FormControl('', []);

	public downloadDropdownControl = new FormControl('', []);

	public columns: string[] = ['Title', 'Subject', 'Status', 'Actions'];

	public tableHeaders: DfmTableHeader[] = [
		{ id: '1', title: 'Title', isSortable: true },
		{ id: '2', title: 'Subject', isSortable: true },
		{ id: '3', title: 'Status', isSortable: true },
	];

	public downloadItems: any[] = [];

	public selectedUserIds: string[] = [];

	public statusType = getStatusEnum();

	public userType = getUserTypeEnum();

	private selectedLang: string = ENG_BE;

	public statuses = Statuses;

	public readonly Permission = Permission;

	public clipboardData: string = '';

	private paginationData: PaginationData | undefined;

	constructor(
		private notificationSvc: NotificationDataService,
		private downloadSvc: DownloadService,
		private emailTemplateApiSvc: EmailTemplateApiService,
		private cdr: ChangeDetectorRef,
		private shareDataSvc: ShareDataService,
		private translate: TranslateService,
		public permissionSvc: PermissionService,
		private translatePipe: TranslatePipe,
		private route: ActivatedRoute,
		private router: Router,
	) {
		super();
		this.emails$$ = new BehaviorSubject<any[]>([]);
		this.filteredEmails$$ = new BehaviorSubject<any[]>([]);
		this.emailTemplateApiSvc.pageNo = 1;
		this.permissionSvc.permissionType$.pipe(takeUntil(this.destroy$$)).subscribe(() => {
			if (
				this.permissionSvc.isPermitted([Permission.UpdateEmailTemplate]) &&
				!this.tableHeaders.find(({ title }) => title === 'Actions' || title === 'Acties')
			) {
				this.tableHeaders = [
					...this.tableHeaders,
					{ id: this.tableHeaders?.length?.toString(), title: 'Actions', isSortable: false, isAction: true },
				];
			}
		});
	}

	public ngOnInit(): void {
		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => (this.downloadItems = items),
		});

		this.filteredEmails$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				this.tableData$$.next({
					items,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.emails$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (emails) => this.handleSearch(this.searchControl.value ?? ''),
		});

		this.emailTemplateApiSvc.emailTemplates$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (emailBase) => {
				if (this.paginationData && this.paginationData.pageNo < emailBase.metaData.pagination.pageNo) {
					this.emails$$.next([...this.emails$$.value, ...emailBase.data]);
				} else {
					this.emails$$.next(emailBase.data);
				}
				this.paginationData = emailBase.metaData?.pagination;
			},
			error: (e) => this.emails$$.next([]),
		});

		this.route.queryParams.pipe(takeUntil(this.destroy$$)).subscribe(({ search }) => {
			this.searchControl.setValue(search);
			if (search) {
				this.handleSearch(search.toLowerCase());
			} else {
				this.filteredEmails$$.next([...this.emails$$.value]);
			}
		});

		this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe({
			next: (searchText) => {
				this.router.navigate([], { queryParams: { search: searchText }, relativeTo: this.route, queryParamsHandling: 'merge', replaceUrl: true });
			},
		});

		this.downloadDropdownControl.valueChanges
			.pipe(
				filter((value) => !!value),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (downloadAs) => {
					if (!this.filteredEmails$$.value.length) {
						this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
						this.clearDownloadDropdown();
						return;
					}

					this.downloadSvc.downloadJsonAs(
						downloadAs as DownloadAsType,
						this.tableHeaders.map(({ title }) => title).slice(0, -1),
						this.filteredEmails$$.value.map((em: Email) => [em.title, em.subject?.toString(), this.translatePipe.transform(StatusToName[em.status])]),
						'email-template',
					);

					if (downloadAs !== 'PRINT') {
						this.notificationSvc.showNotification(`${Translate.DownloadSuccess(downloadAs)[this.selectedLang]}`);
					}
					this.clearDownloadDropdown();
				},
			});

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
			.subscribe({
				next: () => {
					this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
					this.clearSelected$$.next();
				},
			});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => {
				this.selectedLang = lang;

				this.tableHeaders = this.tableHeaders.map((h, i) => ({
					...h,
					title: Translate[this.columns[i]][lang],
				}));

				switch (lang) {
					case ENG_BE:
						this.statuses = Statuses;
						break;
					default:
						this.statuses = StatusesNL;
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
			let dataString = `${this.tableHeaders
				.map(({ title }) => title)
				.slice(0, -1)
				.join('\t')}\n`;

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

	public onScroll(e: undefined): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.emailTemplateApiSvc.pageNo = this.emailTemplateApiSvc.pageNo + 1;
			this.tableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader): void {
		this.filteredEmails$$.next(GeneralUtils.SortArray(this.filteredEmails$$.value, e.sort, ColumnIdToKey[e.id]));
	}
}























