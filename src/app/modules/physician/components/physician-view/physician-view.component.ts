import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { PHYSICIAN_ID } from '../../../../shared/utils/const';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';
import { Physician } from '../../../../shared/models/physician.model';
import { PhysicianAddComponent } from '../physician-add/physician-add.component';

@Component({
  selector: 'dfm-physician-view',
  templateUrl: './physician-view.component.html',
  styleUrls: ['./physician-view.component.scss'],
})
export class PhysicianViewComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public physicianDetails$$ = new BehaviorSubject<Physician | undefined>(undefined);

  constructor(
    private physicianApiSvc: PhysicianApiService,
    private routerStateSvc: RouterStateService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private modalSvc: ModalService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.routerStateSvc
      .listenForParamChange$(PHYSICIAN_ID)
      .pipe(
        switchMap((physicianID) => this.physicianApiSvc.getPhysicianByID(+physicianID)),
        takeUntil(this.destroy$$),
      )
      .subscribe((physicianDetails) => this.physicianDetails$$.next(physicianDetails));
  }

  public deletePhysician(id: number) {
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Physician?',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    modalRef.closed
      .pipe(
        filter((res: boolean) => res),
        take(1),
      )
      .subscribe(() => {
        this.physicianApiSvc.deletePhysician(id);
        this.notificationSvc.showNotification('Physician deleted successfully');
        this.router.navigate(['/', 'physician']);
      });
  }

  public openEditPhysicianModal() {
    this.modalSvc.open(PhysicianAddComponent, {
      data: { edit: !!this.physicianDetails$$.value?.id, physicianDetails: { ...this.physicianDetails$$.value } },
      options: {
        size: 'lg',
        centered: true,
        backdropClass: 'modal-backdrop-remove-mv',
      },
    });
  }
}
