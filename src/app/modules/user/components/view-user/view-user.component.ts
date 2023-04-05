import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, filter, map, Observable, switchMap, take, takeUntil} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {RouterStateService} from '../../../../core/services/router-state.service';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {ModalService} from '../../../../core/services/modal.service';
import {ENG_BE, STAFF_ID} from '../../../../shared/utils/const';
import {
  ConfirmActionModalComponent,
  ConfirmActionModalData
} from '../../../../shared/components/confirm-action-modal.component';
import {StaffApiService} from '../../../../core/services/staff-api.service';
import {AddUserComponent} from '../add-user/add-user.component';
import {User, UserBase, UserType} from '../../../../shared/models/user.model';
import {getUserTypeEnum} from '../../../../shared/utils/getEnums';
import {Translate} from '../../../../shared/models/translate.model';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {NotificationType} from "diflexmo-angular-design";
import {UserManagementApiService} from "../../../../core/services/user-management-api.service";
import {Permission} from "../../../../shared/models/permission.model";

@Component({
  selector: 'dfm-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss'],
})
export class ViewUserComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public userDetails$$ = new BehaviorSubject<User | undefined>(undefined);

  public userTypeEnum = getUserTypeEnum();

  private selectedLang: string = ENG_BE;

  public currentUserType!: UserType;

  constructor(
    private userApiSvc: StaffApiService,
    private routerStateSvc: RouterStateService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private modalSvc: ModalService,
    private shareDataService: ShareDataService,
    private userManagementApiSvc: UserManagementApiService
  ) {
    super();
  }

  public ngOnInit(): void {
    console.log(this.router.url);

    this.routerStateSvc
      .listenForParamChange$(STAFF_ID)
      .pipe(
        switchMap((userID) => {
          if (this.router.url.split('/')[3] === 's') {
            return this.userManagementApiSvc.getUserById(userID).pipe(map((user) => ({
              id: user.id,
              email: user.email,
              firstname: user.givenName,
              lastname: user.surname,
              fullName: user.displayName,
              userType: UserType.Scheduler,
              status: +user.accountEnabled,
            } as unknown as User)));
          }
          return this.userApiSvc.getStaffByID(+userID) as Observable<User>;
        }),
        takeUntil(this.destroy$$),
      )
      .subscribe((userDetails) => {
        this.userDetails$$.next(userDetails)
      });

      this.shareDataService
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => (this.selectedLang = lang));
  }

  public deleteUser(id: number | string) {
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
        switchMap(() => {
          if (this.currentUserType === UserType.Scheduler) {
            return this.userManagementApiSvc.deleteUser(id as string);
          }
          return this.userApiSvc.deleteStaff(id as number);
        }),
        take(1),
      )
      .subscribe({
        next: () => {
          this.notificationSvc.showNotification(Translate.SuccessMessage.UserDeleted[this.selectedLang]);
          this.router.navigate(['/', 'user']);
        },
        error: (err) => {
          console.log(err);
          this.notificationSvc.showNotification('Failed to delete user', NotificationType.DANGER);
        }
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

  protected readonly UserType = UserType;
  protected readonly Permission = Permission;
}
