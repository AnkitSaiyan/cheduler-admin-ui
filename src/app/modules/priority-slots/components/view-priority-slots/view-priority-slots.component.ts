import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, map, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { getUserTypeEnum } from 'src/app/shared/utils/getEnums';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { RepeatType } from 'src/app/shared/models/absence.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ENG_BE, PRIORITY_ID } from '../../../../shared/utils/const';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { AddPrioritySlotsComponent } from '../add-priority-slots/add-priority-slots.component';
import { Translate } from '../../../../shared/models/translate.model';

@Component({
	selector: 'dfm-view-priority-slots',
	templateUrl: './view-priority-slots.component.html',
	styleUrls: ['./view-priority-slots.component.scss'],
})
export class ViewPrioritySlotsComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public prioritySlotDetails$$ = new BehaviorSubject<PrioritySlot | undefined>(undefined);

	public userType = getUserTypeEnum();

	public repeatType = RepeatType;

	private selectedLang: string = ENG_BE;

	public readonly Permission = Permission;

	constructor(
		private routerStateSvc: RouterStateService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private modalSvc: ModalService,
		private priorityApiSvc: PrioritySlotApiService,
		private shareDataService: ShareDataService,
		private route: ActivatedRoute,
	) {
		super();
	}

	public ngOnInit(): void {
		this.route.params
			.pipe(
				filter((params) => params[PRIORITY_ID]),
				map((params) => params[PRIORITY_ID]),
				switchMap((prioritySlotID) => this.priorityApiSvc.getPrioritySlotsByID(+prioritySlotID)),
				takeUntil(this.destroy$$),
			)
			.subscribe((priorityDetails) => this.prioritySlotDetails$$.next(priorityDetails));

		this.shareDataService
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => (this.selectedLang = lang));
	}

	public deletePriority(id: any) {
		const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'Are you sure you want to delete this Priority Slot?',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		modalRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.priorityApiSvc.deletePrioritySlot$(id)),
				take(1),
			)
			.subscribe(() => {
				this.notificationSvc.showNotification(Translate.SuccessMessage.PrioritySlotsDeleted[this.selectedLang]);
				this.router.navigate(['/', 'priority-slots'], { queryParamsHandling: 'merge' });
			});
	}

	public openEditPriorityModal(prioritySlotID: any) {
		this.priorityApiSvc
			.getPrioritySlotsByID(prioritySlotID)
			.pipe(takeUntil(this.destroy$$))
			.subscribe((priorityDetail) => {
				this.prioritySlotDetails$$.next(priorityDetail);
			});

		this.modalSvc.open(AddPrioritySlotsComponent, {
			data: {
				edit: !!this.prioritySlotDetails$$.value?.id,
				prioritySlotDetails: { ...this.prioritySlotDetails$$.value },
			},
			options: {
				size: 'lg',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
			},
		});
	}
}
