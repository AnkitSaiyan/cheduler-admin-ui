import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { STAFF_ID } from '../../../../shared/utils/const';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { AddUserComponent } from '../add-user/add-user.component';
import { User } from '../../../../shared/models/user.model';
import { getUserTypeEnum } from '../../../../shared/utils/getEnums';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';

@Component({
  selector: 'dfm-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss'],
})
export class ViewUserComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public userDetails$$ = new BehaviorSubject<User | undefined>(undefined);

  public userType = getUserTypeEnum();

  private selectedLang: string = ENG_BE;


  constructor(
    private userApiSvc: StaffApiService,
    private routerStateSvc: RouterStateService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private modalSvc: ModalService,
    private shareDataService: ShareDataService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.routerStateSvc
      .listenForParamChange$(STAFF_ID)
      .pipe(
        switchMap((userID) => this.userApiSvc.getStaffByID(+userID)),
        takeUntil(this.destroy$$),
      )
      .subscribe((userDetails) => this.userDetails$$.next(userDetails));

      this.shareDataService
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => (this.selectedLang = lang));
  }

  public deleteUser(id: number) {
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'AreyousureyouwanttodeletethisUser',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as ConfirmActionModalData,
    });

    modalRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => this.userApiSvc.deleteStaff(id)),
        take(1),
      )
      .subscribe(() => {
        this.notificationSvc.showNotification(Translate.SuccessMessage.UserDeleted[this.selectedLang]);
        this.router.navigate(['/', 'user']);
      });
  }

  public openEditUserModal() {
    this.modalSvc.open(AddUserComponent, {
      data: { edit: !!this.userDetails$$.value?.id, userDetails: { ...this.userDetails$$.value } },
      options: {
        size: 'lg',
        centered: true,
        backdropClass: 'modal-backdrop-remove-mv',
      },
    }).result;
  }
}
