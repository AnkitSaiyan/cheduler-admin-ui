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
import { User } from '../../../../shared/models/user.model';
import { AddUserComponent } from 'src/app/modules/user/components/add-user/add-user.component';
import { AddPrioritySlotsComponent } from '../add-priority-slots/add-priority-slots.component';
import { getUserTypeEnum } from 'src/app/shared/utils/getEnums';

@Component({
  selector: 'dfm-view-priority-slots',
  templateUrl: './view-priority-slots.component.html',
  styleUrls: ['./view-priority-slots.component.scss']
})
export class ViewPrioritySlotsComponent extends DestroyableComponent implements OnInit, OnDestroy  {
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
        switchMap(()=>this.userApiSvc.deleteStaff(id)),
        take(1),
      )
      .subscribe(() => {
        this.notificationSvc.showNotification('User deleted successfully');
        this.router.navigate(['/', 'user']);
      });
  }

  public openEditUserModal() {
    this.modalSvc.open(AddPrioritySlotsComponent, {
      data: { edit: !!this.userDetails$$.value?.id, userDetails: { ...this.userDetails$$.value } },
      options: {
        size: 'lg',
        centered: true,
        backdropClass: 'modal-backdrop-remove-mv',
      },
    }).result;
  }
}
