import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, debounceTime, filter, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DfmDatasource, DfmTableHeader, NotificationType, TableItem } from 'diflexmo-angular-design';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ChangeStatusRequestData, Status, StatusToName } from '../../../../shared/models/status.model';
import { getStatusEnum } from '../../../../shared/utils/getEnums';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { DownloadAsType, DownloadService, DownloadType } from '../../../../core/services/download.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { Exam } from '../../../../shared/models/exam.model';
import { ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { TranslateService } from '@ngx-translate/core';
import { Permission } from 'src/app/shared/models/permission.model';
import { PermissionService } from 'src/app/core/services/permission.service';
import { PaginationData } from "../../../../shared/models/base-response.model";
import {GeneralUtils} from "../../../../shared/utils/general.utils";

const ColumnIdToKey = {
  1: 'name',
  2: 'expensive',
  3: 'status'
}

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

	@ViewChild('tableWrapper')
	private tableWrapper!: ElementRef;

	private exams$$: BehaviorSubject<Exam[]>;

	public filteredExams$$: BehaviorSubject<Exam[]>;

	public clearSelected$$ = new Subject<void>();

	public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: Status | null } | null>(null);

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public searchControl = new FormControl('', []);

	public downloadDropdownControl = new FormControl('', []);

	private columns: string[] = ['Name', 'Expensive', 'Status', 'Actions'];

	public tableHeaders: DfmTableHeader[] = [
		{ id: '1', title: 'Name', isSortable: true },
		{ id: '2', title: 'Expensive', isSortable: true },
		{ id: '3', title: 'Status', isSortable: true },
		{ id: '4', title: 'Actions', isSortable: false, isAction: true },
	];

	public downloadItems: DownloadType[] = [];

	public selectedExamIDs: string[] = [];

	public statusType = getStatusEnum();

	public clipboardData: string = '';

	private selectedLang: string = ENG_BE;

	public statuses = Statuses;

	public readonly Permission = Permission;

	private paginationData: PaginationData | undefined;

	constructor(
		private examApiSvc: ExamApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private route: ActivatedRoute,
		private modalSvc: ModalService,
		private downloadSvc: DownloadService,
		private cdr: ChangeDetectorRef,
		private shareDataService: ShareDataService,
		private translate: TranslateService,
		public permissionSvc: PermissionService,
	) {
		super();
		this.exams$$ = new BehaviorSubject<Exam[]>([]);
		this.filteredExams$$ = new BehaviorSubject<Exam[]>([]);
	}

	public ngOnInit(): void {
		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => (this.downloadItems = items),
		});

		this.filteredExams$$.pipe(takeUntil(this.destroy$$)).subscribe((value) => {
			this.tableData$$.next({
				items: value,
				isInitialLoading: false,
				isLoading: false,
				isLoadingMore: false,
			});
		});

		this.exams$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (exams) => this.filteredExams$$.next([...exams]),
		});

		this.examApiSvc.exams$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (examsBase) => {
				if (this.paginationData && this.paginationData.pageNo < examsBase.metaData.pagination.pageNo) {
					this.exams$$.next([...this.exams$$.value, ...examsBase.data]);
				} else {
					this.exams$$.next(examsBase.data);
				}
				this.paginationData = examsBase.metaData.pagination;
			},
			error: (e) => {
				this.exams$$.next([]);
			},
		});

		this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe({
			next: (searchText) => {
				if (searchText) {
					this.handleSearch(searchText.toLowerCase());
				} else {
					this.filteredExams$$.next([...this.exams$$.value]);
				}
			},
		});

		this.downloadDropdownControl.valueChanges
			.pipe(
				filter((value) => !!value),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (downloadAs) => {
					if (!this.filteredExams$$.value.length) {
						this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
						this.clearDownloadDropdown();
						return;
					}

					this.downloadSvc.downloadJsonAs(
						downloadAs as DownloadAsType,
						this.tableHeaders.map(({ title }) => title).slice(0, -1),
						this.filteredExams$$.value.map((ex: Exam) => [ex.name, ex.expensive?.toString(), Translate[StatusToName[+ex.status]][this.selectedLang]]),
						'exams',
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
			.subscribe({
				next: () => {
					this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
					this.clearSelected$$.next();
				},
			});

		combineLatest([this.shareDataService.getLanguage$(), this.permissionSvc.permissionType$])
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: ([lang]) => {
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
				},
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
				let status: string;

				if (exam.status === 1) {
					status = this.translate.instant('Active');
				} else {
					status = this.translate.instant('Inactive');
				}

				return exam.name?.toLowerCase()?.includes(searchText) || status?.toLowerCase()?.startsWith(searchText);
			}),
		]);
	}

	public changeStatus(changes: ChangeStatusRequestData[]) {
		this.examApiSvc
			.changeExamStatus$(changes)
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: () => this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]),
			});
	}

	public deleteExam(id: number) {
		const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreYouSureYouWantToDeleteThisExam',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		modalRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.examApiSvc.deleteExam(id)),
				take(1),
			)
			.subscribe({
				next: () => {
					this.notificationSvc.showNotification(Translate.SuccessMessage.ExamDeleted[this.selectedLang]);
					// filtering out deleted exam
					this.exams$$.next([...this.exams$$.value.filter((exam) => +exam.id !== +id)]);
				},
			});
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

			this.filteredExams$$.value.forEach((exam: Exam) => {
				dataString += `${exam.name}\t${exam.expensive}\t${StatusToName[exam.status]}\n`;
			});

			this.clipboardData = dataString;

			this.cdr.detectChanges();
			this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
		} catch (e) {
			this.notificationSvc.showNotification(Translate.ErrorMessage.CopyToClipboard[this.selectedLang], NotificationType.DANGER);
			this.clipboardData = '';
		}
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
					...this.exams$$.value.map(({ id, name, status }) => ({
						name: `${name}`,
						key: `${name} ${Statuses[+status]}`,
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

	private clearDownloadDropdown(): void {
		const timeout = setTimeout(() => {
			this.downloadDropdownControl.setValue('');
			clearTimeout(timeout);
		}, 0);
	}

	public onScroll(e: undefined): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.examApiSvc.pageNo = this.paginationData.pageNo + 1;
			this.tableData$$.value.isLoadingMore = true;
		}
	}

	public onSort(e: DfmTableHeader): void {
		this.filteredExams$$.next(GeneralUtils.SortArray(this.filteredExams$$.value, e.sort, ColumnIdToKey[e.id]));
	}
}
