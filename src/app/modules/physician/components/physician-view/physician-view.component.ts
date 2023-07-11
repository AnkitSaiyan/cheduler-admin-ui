import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, map, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ENG_BE, PHYSICIAN_ID } from '../../../../shared/utils/const';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';
import { Physician } from '../../../../shared/models/physician.model';
import { PhysicianAddComponent } from '../physician-add/physician-add.component';
import { Status } from '../../../../shared/models/status.model';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from '../../../../core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';

@Component({
	selector: 'dfm-physician-view',
	templateUrl: './physician-view.component.html',
	styleUrls: ['./physician-view.component.scss'],
})
export class PhysicianViewComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public physicianDetails$$ = new BehaviorSubject<Physician | undefined>(undefined);

	public statusEnum = Status;

	private selectedLanguage: string = ENG_BE;

	public readonly Permission = Permission;

	constructor(
		private physicianApiSvc: PhysicianApiService,
		private routerStateSvc: RouterStateService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private modalSvc: ModalService,
		private shareDataSvc: ShareDataService,
		private route: ActivatedRoute,
	) {
		super();
	}

	public ngOnInit(): void {
		this.route.params
			.pipe(
				filter((params) => params[PHYSICIAN_ID]),
				map((params) => params[PHYSICIAN_ID]),
				switchMap((physicianID) => this.physicianApiSvc.getPhysicianByID(+physicianID)),
				takeUntil(this.destroy$$),
			)
			.subscribe((physicianDetails) => this.physicianDetails$$.next(physicianDetails));

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => (this.selectedLanguage = lang));
	}

	public deletePhysician(id: number) {
		const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreyousureyouwanttodeletethisPhysician',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		modalRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.physicianApiSvc.deletePhysician(id)),
				take(1),
			)
			.subscribe(() => {
				this.notificationSvc.showNotification(Translate.SuccessMessage.PhysicianDeleted[this.selectedLanguage]);
				this.router.navigate(['/', 'physician'], { queryParamsHandling: 'merge', relativeTo: this.route });
			});
	}

	public openEditPhysicianModal(physicianDetails?: Physician) {
		this.modalSvc.open(PhysicianAddComponent, {
			data: { edit: !!physicianDetails?.id, physicianDetails },
			options: {
				size: 'lg',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
			},
		});
	}
}
