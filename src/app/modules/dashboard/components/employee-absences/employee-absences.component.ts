import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DfmDatasource, DfmTableHeader, NotificationType } from 'diflexmo-angular-design';
import { BehaviorSubject, debounceTime, takeUntil } from 'rxjs';
import { AbsenceApiService } from 'src/app/core/services/absence-api.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { Absence } from 'src/app/shared/models/absence.model';
import { PaginationData } from 'src/app/shared/models/base-response.model';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';
import { Translate } from '../../../../shared/models/translate.model';
import { ENG_BE } from '../../../../shared/utils/const';

@Component({
	selector: 'dfm-employee-absences',
	templateUrl: './employee-absences.component.html',
	styleUrls: ['./employee-absences.component.scss'],
})
export class EmployeeAbsencesComponent extends DestroyableComponent implements OnInit, OnDestroy {
	private absences$$: BehaviorSubject<any[]>;

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public filteredAbsence$$: BehaviorSubject<any[]>;

	public searchControl = new FormControl('', []);

	public columns: string[] = ['Title', 'StartDate', 'EndDate', 'AbsenceInfo'];

	private selectedLang: string = ENG_BE;

	public clipboardData: string = '';

	private paginationData: PaginationData | undefined;

	constructor(
		private absenceApiService: AbsenceApiService,
		private notificationSvc: NotificationDataService,
		private modalSvc: ModalService,
		private cdr: ChangeDetectorRef,
		private shareDataSvc: ShareDataService,
		private datePipe: DatePipe,
	) {
		super();
		this.absences$$ = new BehaviorSubject<any[]>([]);
		this.filteredAbsence$$ = new BehaviorSubject<any[]>([]);
    this.absenceApiService.pageNoOnDashboard = 1;
	}

	async ngOnInit(): Promise<void> {
		this.filteredAbsence$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				this.tableData$$.next({
					items,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.absences$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (absences) => this.filteredAbsence$$.next([...absences]),
		});

		this.absenceApiService.absencesOnDashboard$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (employeeAbsencesBase) => {
				if (this.paginationData && this.paginationData.pageNo < employeeAbsencesBase.metaData.pagination.pageNo) {
					this.absences$$.next([...this.absences$$.value, ...employeeAbsencesBase.data]);
				} else {
					this.absences$$.next(employeeAbsencesBase.data);
				}
				this.paginationData = employeeAbsencesBase.metaData.pagination;
			},
			error: () => this.absences$$.next([]),
		});

		this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe({
			next: (searchText) => {
				if (searchText) {
					this.handleSearch(searchText.toLowerCase());
				} else {
					this.filteredAbsence$$.next([...this.absences$$.value]);
				}
			}
		});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => {
					this.selectedLang = lang;
					this.columns = [Translate.Title[lang], Translate.StartDate[lang], Translate.EndDate[lang], Translate.AbsenceInfo[lang]];
				}
			});
	}

	public copyToClipboard() {
		try {
			let dataString = `${this.columns.join('\t')}\n`;

			this.filteredAbsence$$.value.forEach((absence: Absence) => {
				dataString += `${absence.name}\t${absence.startedAt}\t${absence.endedAt}\t${absence.info}\n`;
			});

			this.clipboardData = dataString;

			this.cdr.detectChanges();
			this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
		} catch (e) {
			this.notificationSvc.showNotification(Translate.ErrorMessage.CopyToClipboard[this.selectedLang], NotificationType.DANGER);
			this.clipboardData = '';
		}
	}

	private handleSearch(searchText: string): void {
		this.filteredAbsence$$.next([
			...this.absences$$.value.filter((absence: Absence) => {
				return (
					absence.name?.toLowerCase()?.includes(searchText) ||
					this.datePipe.transform(absence.startedAt, 'dd/MM/yyyy, HH:mm')?.includes(searchText) ||
					this.datePipe.transform(absence.endedAt, 'dd/MM/yyyy, HH:mm')?.includes(searchText)
				);
			}),
		]);
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public onScroll(): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.absenceApiService.pageNoOnDashboard = this.absenceApiService.pageNoOnDashboard + 1;
		}
	}
}
