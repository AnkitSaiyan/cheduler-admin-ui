import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { STAFF_ID } from '../../../../shared/utils/const';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { AddUserComponent } from '../add-user/add-user.component';
import { User } from '../../../../shared/models/user.model';
import { getUserTypeEnum } from '../../../../shared/utils/getUserTypeEnum';

@Component({
  selector: 'dfm-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss'],
})
export class ViewUserComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public userDetails$$ = new BehaviorSubject<User | undefined>(undefined);

  public userType = getUserTypeEnum();

  constructor(
    private userApiSvc: StaffApiService,
    private routerStateSvc: RouterStateService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private modalSvc: ModalService,
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
  }

  public deleteUser(id: number) {
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this User?',
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
        this.userApiSvc.deleteStaff(id);
        this.notificationSvc.showNotification('User deleted successfully');
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
    });
  }
}