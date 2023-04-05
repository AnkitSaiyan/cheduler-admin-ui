import {Component, OnDestroy, OnInit} from '@angular/core';
import {NotificationType} from 'diflexmo-angular-design';
import {BehaviorSubject, Observable, switchMap, take, takeUntil} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {ModalService} from '../../../../core/services/modal.service';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {AddUserRequest, User, UserRoleEnum, UserType} from '../../../../shared/models/user.model';
import {getUserTypeEnum} from '../../../../shared/utils/getEnums';
import {StaffApiService} from '../../../../core/services/staff-api.service';
import {Status} from '../../../../shared/models/status.model';
import {DUTCH_BE, EMAIL_REGEX, ENG_BE, Statuses, StatusesNL} from '../../../../shared/utils/const';

import {Translate} from '../../../../shared/models/translate.model';
import {UserApiService} from "../../../../core/services/user-api.service";
import {NameValue} from "../../../../shared/components/search-modal.component";
import {UserManagementApiService} from "../../../../core/services/user-management-api.service";
import {environment} from "../../../../../environments/environment";
import {AuthService} from "../../../../core/services/auth.service";
import {AddStaffRequestData} from "../../../../shared/models/staff.model";
import {MsalService} from "@azure/msal-angular";

interface FormValues {
  userType: UserType;
  firstname: string;
  lastname: string;
  email: string;
  userRole: UserRoleEnum;
  tenantId: string;
}

@Component({
  selector: 'dfm-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
})
export class AddUserComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public addUserForm!: FormGroup;

  public modalData!: { edit: boolean; userDetails: User };

  public userType = getUserTypeEnum();

  public loading$$ = new BehaviorSubject<boolean>(false);

  private selectedLang: string = ENG_BE;

  public statuses = Statuses;

  public userRoles: NameValue[] = [];

  public userTenants: NameValue[] = [];

  constructor(
    private modalSvc: ModalService,
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private staffApiSvc: StaffApiService,
    private shareDataSvc: ShareDataService,
    private userSvc: UserApiService,
    private userManagementApiSvc: UserManagementApiService,
    private authSvc: AuthService,
    private msalService: MsalService
  ) {
    super();

    this.modalSvc.dialogData$.pipe(take(1)).subscribe((data) => {
      this.modalData = data;

      this.createForm(this.modalData?.userDetails);
    });
  }

  public ngOnInit(): void {
    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => {
        this.selectedLang = lang;

        // eslint-disable-next-line default-case
        switch (lang) {
          case ENG_BE:
            this.statuses = Statuses;
            break;
          case DUTCH_BE:
            this.statuses = StatusesNL;
            break;
        }
      });

    const userId = this.msalService.instance.getActiveAccount()?.localAccountId ?? '';
    this.userManagementApiSvc.getUserTenantsList(userId).pipe(takeUntil(this.destroy$$)).subscribe((tenants) => {
      this.userTenants = tenants.map(({id, name}) => ({ name, value: id.toString()}));
    });

    this.userRoles = this.userSvc.getUserRoles();
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get formValues(): FormValues {
    return this.addUserForm.value;
  }

  private createForm(userDetails?: User | undefined): void {
    this.addUserForm = this.fb.group({
      userType: [
        {
          value: userDetails?.userType ?? UserType.Scheduler,
          disabled: this.modalData.edit,
        },
        [Validators.required],
      ],
      firstname: [userDetails?.firstname ?? '', [Validators.required]],
      lastname: [userDetails?.lastname ?? '', [Validators.required]],
      email: [userDetails?.email ?? '', []],
      userRole: [null, []],
      tenantId: [null, []]
    });
  }

  public closeModal(res: boolean) {
    this.modalSvc.close(res);
  }

  public saveUser() {
    let isInvalid = false;

    if ([this.formValues.userType, this.modalData?.userDetails?.userType].includes(UserType.Scheduler)) {
      if (this.addUserForm.invalid) {
        isInvalid = true;
      }
    } else {
      const requiredFields = ['firstname', 'lastname'];
      if (requiredFields.some((key) => this.addUserForm.get(key)?.invalid)) {
        requiredFields.forEach((key) => this.addUserForm.get(key)?.markAsTouched());
        isInvalid = true;
      }
    }

    if (isInvalid) {
      this.notificationSvc.showNotification(`${Translate.FormInvalid[this.selectedLang]}`, NotificationType.WARNING);
      this.addUserForm.markAllAsTouched();
      return;
    }

    this.loading$$.next(true);

    console.log(this.formValues);

    let addUserObservable$: Observable<any>;

    if ([this.formValues.userType, this.modalData?.userDetails?.userType].includes(UserType.Scheduler)) {
      addUserObservable$ = this.userManagementApiSvc.createUserInvite({
        givenName: this.formValues.firstname,
        surName: this.formValues.lastname,
        email: this.formValues.email,
        roleName: this.formValues.userRole,
        contextTenantId: this.formValues.tenantId,
        redirect: {
          redirectUrl: environment.redirectUrl
        }
      });
    } else {
      addUserObservable$ = this.staffApiSvc.upsertUser$({
        firstname: this.formValues.firstname,
        lastname: this.formValues.lastname,
        email: this.formValues.email ?? null,
        userType: this.modalData.edit ? this.modalData.userDetails.userType : this.formValues.userType,
        ...(this.modalData.userDetails ? { id: this.modalData.userDetails.id } : {}),
      });
    }

    addUserObservable$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: () => {
        if (this.modalData.edit) {
          this.notificationSvc.showNotification(Translate.SuccessMessage.UserUpdated[this.selectedLang]);
        } else {
          this.notificationSvc.showNotification(Translate.SuccessMessage.UserAdded[this.selectedLang]);
        }
        this.loading$$.next(false);
        this.closeModal(true);
      },
      error: (err) => {
        console.log(err);
        this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
        this.loading$$.next(false);
      }
    });

    // if (
    //   [UserType.Scheduler, UserType.Secretary].includes(this.formValues.userType) ||
    //   [UserType.Scheduler, UserType.Secretary].includes(this.modalData?.userDetails?.userType)
    // ) {
    //   this.userManagementApiSvc.createUserInvite({
    //     givenName: this.formValues.firstname,
    //     surName: this.formValues.lastname,
    //     email: this.formValues.email,
    //     roleName: this.formValues.userRole,
    //     contextTenantId: this.formValues.tenantId,
    //     redirect: {
    //       redirectUrl: environment.redirectUrl
    //     }
    //   }).pipe(
    //     switchMap((resp) => {
    //       const requestBody: AddStaffRequestData = {
    //         userAzureId: resp.id,
    //         userRole: this.formValues.userRole,
    //         userType: this.formValues.userType,
    //       }
    //       return this.staffApiSvc.upsertUser$(requestBody);
    //     }),
    //     takeUntil(this.destroy$$)
    //   ).subscribe({
    //     next: () => {
    //       if (this.modalData.edit) {
    //         this.notificationSvc.showNotification(Translate.SuccessMessage.UserUpdated[this.selectedLang]);
    //       } else {
    //         this.notificationSvc.showNotification(Translate.SuccessMessage.UserAdded[this.selectedLang]);
    //       }
    //       this.loading$$.next(false);
    //       this.closeModal(true);
    //     },
    //     error: (err) => {
    //       console.log(err);
    //       this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
    //       this.loading$$.next(false);
    //     }
    //   });
    // } else {
    //   this.staffApiSvc.upsertUser$({
    //     firstname: this.formValues.firstname,
    //     lastname: this.formValues.lastname,
    //     email: this.formValues.email ?? null,
    //     userType: this.modalData.edit ? this.modalData.userDetails.userType : this.formValues.userType,
    //     ...(this.modalData.userDetails ? { id: this.modalData.userDetails.id } : {}),
    //   }).pipe(takeUntil(this.destroy$$)).subscribe({
    //     next: () => {
    //       if (this.modalData.edit) {
    //         this.notificationSvc.showNotification(Translate.SuccessMessage.UserUpdated[this.selectedLang]);
    //       } else {
    //         this.notificationSvc.showNotification(Translate.SuccessMessage.UserAdded[this.selectedLang]);
    //       }
    //       this.loading$$.next(false);
    //       this.closeModal(true);
    //     },
    //     error: (err) => {
    //       console.log(err);
    //       this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
    //       this.loading$$.next(false);
    //     }
    //   })
    // }

    // const { gsm, address, status, ...rest } = this.formValues;
    //
    // let addUserReqData: AddStaffRequestData = { ...rest, status: +status };
    //
    // if (
    //   [UserType.Scheduler, UserType.Secretary].includes(this.formValues.userType) ||
    //   [UserType.Scheduler, UserType.Secretary].includes(this.modalData?.userDetails?.userType)
    // ) {
    //   addUserReqData = {
    //     ...addUserReqData,
    //     gsm,
    //     address,
    //   };
    // }
    //
    // if (this.modalData.edit) {
    //   addUserReqData.userType = this.modalData.userDetails.userType;
    // }
    //
    // if (this.modalData?.userDetails?.id) {
    //   addUserReqData.id = this.modalData.userDetails.id;
    // }
    //
    // if (!addUserReqData.email) {
    //   addUserReqData.email = null;
    // }
    //
    // addUserReqData.id = this.modalData?.userDetails?.id ?? 0;
    //
    // this.staffApiSvc
    //   .addNewStaff$(addUserReqData)
    //   .pipe(takeUntil(this.destroy$$))
    //   .subscribe(
    //     () => {
    //       if (this.modalData.edit) {
    //         this.notificationSvc.showNotification(Translate.SuccessMessage.UserUpdated[this.selectedLang]);
    //       } else {
    //         this.notificationSvc.showNotification(Translate.SuccessMessage.UserAdded[this.selectedLang]);
    //       }
    //       this.loading$$.next(false);
    //       this.closeModal(true);
    //     },
    //     (err) => {
    //       this.loading$$.next(false);
    //       this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
    //     },
    //   );
  }

  public handleEmailInput(e: Event): void {
    const inputText = (e.target as HTMLInputElement).value;

    if (!inputText) {
      return;
    }

    if (!inputText.match(EMAIL_REGEX)) {
      this.addUserForm.get('email')?.setErrors({
        email: true,
      });
    } else {
      this.addUserForm.get('email')?.setErrors(null);
    }
  }

  protected readonly UserType = UserType;
}
