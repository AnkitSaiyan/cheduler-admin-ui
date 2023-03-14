import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationType } from 'diflexmo-angular-design';
import { BehaviorSubject, take, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { User, UserType } from '../../../../shared/models/user.model';
import { getUserTypeEnum } from '../../../../shared/utils/getEnums';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { AddStaffRequestData } from '../../../../shared/models/staff.model';
import { Status } from '../../../../shared/models/status.model';
import { EMAIL_REGEX } from '../../../../shared/utils/const';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';

interface FormValues {
  userType: UserType;
  firstname: string;
  lastname: string;
  email: string;
  address: string;
  telephone: number;
  gsm: string;
  status: Status;
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

  constructor(
    private modalSvc: ModalService,
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private userApiSvc: StaffApiService,
    private shareDataSvc: ShareDataService,
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
      telephone: [userDetails?.telephone, []],
      gsm: [userDetails?.gsm, []],
      address: [userDetails?.address, []],
      status: [this.modalData.edit ? !!userDetails?.status : Status.Inactive, []],
    });
  }

  public closeModal(res: boolean) {
    this.modalSvc.close(res);
    // this.ngOnDestroy();
  }

  public saveUser() {
    if (this.addUserForm.invalid) {
      this.notificationSvc.showNotification(`${Translate.FormInvalid[this.selectedLang]}`, NotificationType.WARNING);
      this.addUserForm.markAllAsTouched();
      return;
    }

    this.loading$$.next(true);

    const { gsm, address, status, ...rest } = this.formValues;

    let addUserReqData: AddStaffRequestData = { ...rest, status: +status };

    if (
      [UserType.Scheduler, UserType.Secretary].includes(this.formValues.userType) ||
      [UserType.Scheduler, UserType.Secretary].includes(this.modalData?.userDetails?.userType)
    ) {
      addUserReqData = {
        ...addUserReqData,
        gsm,
        address,
      };
    }

    if (this.modalData.edit) {
      addUserReqData.userType = this.modalData.userDetails.userType;
    }

    if (this.modalData?.userDetails?.id) {
      addUserReqData.id = this.modalData.userDetails.id;
    }

    if (!addUserReqData.email) {
      addUserReqData.email = null;
    }

    addUserReqData.id = this.modalData?.userDetails?.id ?? 0;

    this.userApiSvc
      .addNewStaff$(addUserReqData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(
        () => {
          if (this.modalData.edit) {
            this.notificationSvc.showNotification(Translate.SuccessMessage.Updated[this.selectedLang]);
          } else {
            this.notificationSvc.showNotification(Translate.SuccessMessage.Added[this.selectedLang]);
          }
          this.loading$$.next(false);
          this.closeModal(true);
        },
        (err) => {
          this.loading$$.next(false);
          this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
        },
      );

    // if (this.modalData.edit) {
    //   this.userApiSvc
    //     .updateStaff(addUserReqData)
    //     .pipe(takeUntil(this.destroy$$))
    //     .subscribe(
    //       () => {
    //         this.notificationSvc.showNotification(`User updated successfully`);
    //         this.loading$$.next(false);
    //         this.closeModal(true);
    //       },
    //       (err) => {
    //         this.loading$$.next(false);
    //         this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
    //       },
    //     );
    // } else {
    //   this.userApiSvc
    //     .addNewStaff$(addUserReqData)
    //     .pipe(takeUntil(this.destroy$$))
    //     .subscribe(
    //       () => {
    //         this.notificationSvc.showNotification(`User added successfully`);
    //         this.loading$$.next(false);
    //         this.closeModal(true);
    //       },
    //       (err) => {
    //         this.loading$$.next(false);
    //         this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
    //       },
    //     );
    // }
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
}
