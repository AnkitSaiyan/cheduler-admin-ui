import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, filter, switchMap, take, takeUntil} from 'rxjs';
import {Router} from '@angular/router';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {RouterStateService} from '../../../../core/services/router-state.service';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {ModalService} from '../../../../core/services/modal.service';
import {ENG_BE, PHYSICIAN_ID} from '../../../../shared/utils/const';
import {ConfirmActionModalComponent, DialogData} from '../../../../shared/components/confirm-action-modal.component';
import {PhysicianApiService} from '../../../../core/services/physician.api.service';
import {Physician} from '../../../../shared/models/physician.model';
import {PhysicianAddComponent} from '../physician-add/physician-add.component';
import {Status} from '../../../../shared/models/status.model';
import {Translate} from "../../../../shared/models/translate.model";
import {ShareDataService} from "../../../../core/services/share-data.service";

@Component({
  selector: 'dfm-physician-view',
  templateUrl: './physician-view.component.html',
  styleUrls: ['./physician-view.component.scss'],
})
export class PhysicianViewComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public physicianDetails$$ = new BehaviorSubject<Physician | undefined>(undefined);

  public statusEnum = Status;

  private selectedLanguage: string = ENG_BE;

  constructor(
    private physicianApiSvc: PhysicianApiService,
    private routerStateSvc: RouterStateService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private modalSvc: ModalService,
    private shareDataSvc: ShareDataService
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

    this.shareDataSvc.getLanguage$().pipe(takeUntil(this.destroy$$)).subscribe((lang) => (this.selectedLanguage = lang));
  }

  public deletePhysician(id: number) {
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'AreyousureyouwanttodeletethisPhysician',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    modalRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => this.physicianApiSvc.deletePhysician(id)),
        take(1),
      )
      .subscribe(() => {
        this.notificationSvc.showNotification(Translate.SuccessMessage.Deleted[this.selectedLanguage]);
        this.router.navigate(['/', 'physician']);
      });
  }

  public openEditPhysicianModal(physicianDetails?: Physician) {
    this.modalSvc.open(PhysicianAddComponent, {
      data: {edit: !!physicianDetails?.id, physicianDetails},
      options: {
        size: 'lg',
        centered: true,
        backdropClass: 'modal-backdrop-remove-mv',
      },
    });
  }
}
