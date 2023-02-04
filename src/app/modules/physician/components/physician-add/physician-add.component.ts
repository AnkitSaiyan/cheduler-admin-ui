import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { take, takeUntil } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { WeekdayModel } from '../../../../shared/models/weekday.model';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { AddPhysicianRequestData, Physician } from '../../../../shared/models/physician.model';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';

interface FormValues {
  firstname: string;
  lastname: string;
  email: string;
  address: string;
  rizivNumber: string;
  telephone: number;
  gsm: string;
  notifyDoctor: boolean;
}

@Component({
  selector: 'dfm-physician-add',
  templateUrl: './physician-add.component.html',
  styleUrls: ['./physician-add.component.scss'],
})
export class PhysicianAddComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public addPhysicianForm!: FormGroup;

  public modalData!: { edit: boolean; physicianDetails: Physician };

  public weekdayEnum = WeekdayModel;

  constructor(
    private modalSvc: ModalService,
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private physicianApiSvc: PhysicianApiService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.modalSvc.dialogData$.pipe(take(1)).subscribe((data) => {
      this.modalData = data;
      this.createForm(this.modalData?.physicianDetails);
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get formValues(): FormValues {
    return this.addPhysicianForm.value;
  }

  private createForm(physicianDetails?: Physician | undefined): void {
    this.addPhysicianForm = this.fb.group({
      firstname: [physicianDetails?.firstname ?? '', [Validators.required]],
      lastname: [physicianDetails?.lastname ?? '', [Validators.required]],
      email: [physicianDetails?.email ?? '', [Validators.required]],
      rizivNumber: [physicianDetails?.rizivNumber ?? null, [Validators.required]],
      telephone: [physicianDetails?.telephone, [Validators.required]],
      gsm: [physicianDetails?.gsm, [Validators.required]],
      address: [physicianDetails?.address, []],
      notifyDoctor: [!!physicianDetails?.notifyDoctor, []],
    });
  }

  public closeModal(res: boolean) {
    this.modalSvc.close(res);
    this.ngOnDestroy();
  }

  public savePhysician() {
    if (this.addPhysicianForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.addPhysicianForm.updateValueAndValidity();
      return;
    }

    console.log(this.formValues);

    const addPhysicianReqData: AddPhysicianRequestData = {
      ...this.formValues,
    };

    if (this.modalData?.physicianDetails?.id) {
      addPhysicianReqData.id = this.modalData.physicianDetails.id;
    }

    console.log(addPhysicianReqData);

    if (this.modalData.edit) {
      this.physicianApiSvc
      .updatePhysician$(addPhysicianReqData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification(`Physician ${this.modalData.edit ? 'updated' : 'added'} successfully`);
        this.closeModal(true);
      });
    }else{
      this.physicianApiSvc
        .addPhysician$(addPhysicianReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(() => {
          this.notificationSvc.showNotification(`Physician ${this.modalData.edit ? 'updated' : 'added'} successfully`);
          this.closeModal(true);
        });
    }


  
  }
}
