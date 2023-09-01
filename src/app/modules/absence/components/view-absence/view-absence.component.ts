import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, filter, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { AbsenceApiService } from '../../../../core/services/absence-api.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Absence, RepeatType } from '../../../../shared/models/absence.model';
import { Translate } from '../../../../shared/models/translate.model';
import { ABSENCE_ID, ABSENCE_TYPE, ABSENCE_TYPE_ARRAY, ENG_BE } from '../../../../shared/utils/const';
import { AddAbsenceComponent } from '../add-absence/add-absence.component';

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

	public columns = ['AppointmentNo', 'Exam', 'StartDate', 'EndDate', 'PatientName', 'Edit'];

	public absenceType$$ = new BehaviorSubject<(typeof ABSENCE_TYPE_ARRAY)[number]>(ABSENCE_TYPE_ARRAY[0]);

	effectedAppointments$$: BehaviorSubject<any> = new BehaviorSubject<any[]>([]);

	constructor(
		private absenceApiSvc: AbsenceApiService,
		private routerStateSvc: RouterStateService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private modalSvc: ModalService,
		private shareDataService: ShareDataService,
		private route: ActivatedRoute,
	) {
		super();
	}

	public ngOnInit(): void {
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
			.subscribe((lang) => (this.selectedLang = lang));
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
				filter((res: boolean) => {
					return res;
				}),
				switchMap(() => this.absenceApiSvc.deleteAbsence$(id)),
				take(1),
			)
			.subscribe(() => {
				this.notificationSvc.showNotification(Translate.SuccessMessage.AbsenceDeleted[this.selectedLang]);
				this.router.navigate(['/', 'absence'], { queryParamsHandling: 'merge' });
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
}
