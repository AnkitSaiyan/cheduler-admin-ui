import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationType } from 'diflexmo-angular-design';
import { take, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { User, UserType } from '../../../../shared/models/user.model';
import { getUserTypeEnum } from '../../../../shared/utils/getUserTypeEnum';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { AddStaffRequestData } from '../../../../shared/models/staff.model';

interface FormValues {
  userType: UserType.General | UserType.Scheduler;
  firstname: string;
  lastname: string;
  email: string;
  address: string;
  telephone: number;
  gsm: string;
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

  constructor(
    private modalSvc: ModalService,
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private userApiSvc: StaffApiService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.modalSvc.dialogData$.pipe(take(1)).subscribe((data) => {
      this.modalData = data;
      this.createForm(this.modalData?.userDetails);
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
    });
  }

  public closeModal(res: boolean) {
    this.modalSvc.close(res);
    this.ngOnDestroy();
  }

  public saveUser() {
    if (this.addUserForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.addUserForm.updateValueAndValidity();
      return;
    }

    console.log(this.formValues);

    const { gsm, address, ...rest } = this.formValues;

    let addUserReqData: AddStaffRequestData = { ...rest };

    if (this.formValues.userType === this.userType.Scheduler || this.modalData.userDetails.userType === this.userType.Scheduler) {
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

    console.log(addUserReqData);

    this.userApiSvc
      .upsertStaff$(addUserReqData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification(`User ${this.modalData.edit ? 'updated' : 'added'} successfully`);
        this.closeModal(true);
      });
  }
}