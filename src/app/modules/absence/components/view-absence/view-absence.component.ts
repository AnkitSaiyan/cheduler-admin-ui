import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, filter, map, switchMap, take, takeUntil } from 'rxjs';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { AbsenceApiService } from '../../../../core/services/absence-api.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Absence, RepeatType } from '../../../../shared/models/absence.model';
import { Translate } from '../../../../shared/models/translate.model';
import { ABSENCE_ID, ABSENCE_TYPE, ABSENCE_TYPE_ARRAY, ENG_BE } from '../../../../shared/utils/const';
import { AddAbsenceComponent } from '../add-absence/add-absence.component';
import { DfmDatasource, DfmTableHeader } from 'diflexmo-angular-design';

@Component({
	selector: 'dfm-view-absence',
	templateUrl: './view-absence.component.html',
	styleUrls: ['./view-absence.component.scss'],
})
export class ViewAbsenceComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public absenceDetails$$ = new BehaviorSubject<Absence | undefined>(undefined);

	public repeatType = RepeatType;

	private selectedLang: string = ENG_BE;

	public readonly Permission = Permission;

	public columns = ['AppointmentNo', 'PatientName', 'StartDate', 'EndDate'];

	public absenceType$$ = new BehaviorSubject<(typeof ABSENCE_TYPE_ARRAY)[number]>(ABSENCE_TYPE_ARRAY[0]);

	effectedAppointments$$: BehaviorSubject<any> = new BehaviorSubject<any[]>([]);

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public tableHeaders: DfmTableHeader[] = [
		{ id: '1', title: 'AppointmentNo', isSortable: true },
		{ id: '2', title: 'PatientName', isSortable: true },
		{ id: '3', title: 'StartDate', isSortable: true },
		{ id: '4', title: 'EndDate', isSortable: true },
	];

	constructor(
		private absenceApiSvc: AbsenceApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private modalSvc: ModalService,
		private shareDataService: ShareDataService,
		private route: ActivatedRoute,
	) {
		super();
	}

	public ngOnInit(): void {
		this.getAppointmentListModified();
		this.route.data
			.pipe(
				filter((data) => !!data[ABSENCE_TYPE]),
				map((data) => data[ABSENCE_TYPE]),
				takeUntil(this.destroy$$),
			)
			.subscribe((absenceType) => {
				this.absenceType$$.next(absenceType);
			});
		this.route.params
			.pipe(
				filter((params) => params[ABSENCE_ID]),
				map((params) => params[ABSENCE_ID]),
				switchMap((absenceID) => this.absenceApiSvc.getAbsenceByID$(+absenceID)),
				takeUntil(this.destroy$$),
			)
			.subscribe((absenceDetails) => {
				this.absenceDetails$$.next(absenceDetails);
			});

		this.shareDataService
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => {
				this.selectedLang = lang;
				this.tableHeaders = this.tableHeaders.map((h, i) => ({
					...h,
					title: Translate[this.columns[i]][lang],
				}));
			});

		this.effectedAppointments$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (value) => {
				this.tableData$$.next({
					items: value,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});
	}

	public deleteAbsence(id: number) {
		const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText:
					this.absenceType$$.value === ABSENCE_TYPE_ARRAY?.[2]
						? 'AreyousureyouwanttodeletethisPunlicHoliday'
						: 'AreyousureyouwanttodeletethisAbsence',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		modalRef.closed
			.pipe(
				filter((res: boolean) => {
					return res;
				}),
				switchMap(() => this.absenceApiSvc.deleteAbsence$(id)),
				switchMap(() => this.route.data),
				take(1),
			)
			.subscribe((data) => {
				this.notificationSvc.showNotification(
					this.absenceType$$.value === ABSENCE_TYPE_ARRAY?.[2]
						? Translate.SuccessMessage.PublicHolidayDeleted[this.selectedLang]
						: Translate.SuccessMessage.AbsenceDeleted[this.selectedLang],
				);
				this.router.navigate(['/', 'absence', data[ABSENCE_TYPE]], { queryParamsHandling: 'merge' });
			});
	}

	public openEditAbsenceModal() {
		this.modalSvc.open(AddAbsenceComponent, {
			data: { absenceType: this.absenceType$$.value, edit: !!this.absenceDetails$$.value?.id, absenceID: this.absenceDetails$$.value?.id },
			options: {
				size: 'xl',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
				keyboard: false,
			},
		});
	}

	private getAppointmentListModified() {
		const impactedAppointmentDetails = [
			{
				appointmentId: 263,
				patientFname: 'niti',
				patientLname: 'yadav',
				examDetails: [
					{
						examId: 39,
						roomId: 0,
						startedAt: '2024-02-10 11:50:00',
						endedAt: '2024-02-10 12:00:00',
					},
				],
			},
			{
				appointmentId: 265,
				patientFname: 'niti',
				patientLname: 'yadav',
				examDetails: [
					{
						examId: 39,
						roomId: 0,
						startedAt: '2024-02-10 10:30:00',
						endedAt: '2024-02-10 10:45:00',
					},
					{
						examId: 40,
						roomId: 0,
						startedAt: '2024-02-10 10:40:00',
						endedAt: '2024-02-10 10:55:00',
					},
				],
			},
			{
				appointmentId: 264,
				patientFname: 'niti',
				patientLname: 'yadav',
				examDetails: [
					{
						examId: 39,
						roomId: 0,
						startedAt: '2024-02-10 10:30:00',
						endedAt: '2024-02-10 10:40:00',
					},
					{
						examId: 40,
						roomId: 0,
						startedAt: '2024-02-10 10:40:00',
						endedAt: '2024-02-10 10:55:00',
					},
				],
			},
		];
		this.effectedAppointments$$.next(impactedAppointmentDetails.map((appointment) => this.getAppointmentModified(appointment)));
	}

	private getAppointmentModified(appointment) {
		let startedAt;
		let endedAt;

		let { patientFname, patientLname, ...rest } = appointment;

		appointment.examDetails.forEach((exam) => {
			if (exam.startedAt && (!startedAt || new Date(exam.startedAt) < startedAt)) {
				startedAt = new Date(exam.startedAt);
			}

			if (exam.endedAt && (!endedAt || new Date(exam.endedAt) > endedAt)) {
				endedAt = new Date(exam.endedAt);
			}
		});
		return {
			...rest,
			patientFullName: `${patientFname} ${patientLname}`,
			startedAt: startedAt,
			endedAt: endedAt,
		};
	}

	public navigateToView(e: any) {
		if (e?.appointmentId) {
			// localStorage.setItem('previousPagefromView', 'dashboard');
			this.router.navigate([`/appointment/${e.appointmentId}/view`], { replaceUrl: true });
		}
	}
}
