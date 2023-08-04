import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, take, takeUntil } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { AddPhysicianRequestData, Physician } from '../../../../shared/models/physician.model';
import { PhysicianApiService } from '../../../../core/services/physician.api.service';
import { Status } from '../../../../shared/models/status.model';
import {EMAIL_REGEX, ENG_BE} from '../../../../shared/utils/const';
import {ShareDataService} from "../../../../core/services/share-data.service";
import {Translate} from "../../../../shared/models/translate.model";

interface FormValues {
  firstname: string;
  lastname: string;
  email: string;
  address: string;
  rizivNumber: string;
  telephone: number;
  gsm: string;
  notifyDoctor: boolean;
  status: Status;
}

@Component({
  selector: 'dfm-physician-add',
  templateUrl: './physician-add.component.html',
  styleUrls: ['./physician-add.component.scss'],
})
export class PhysicianAddComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public addPhysicianForm!: FormGroup;

  public modalData!: { edit: boolean; physicianDetails: Physician };

  public loading$$ = new BehaviorSubject<boolean>(false);

  private selectedLanguage: string = ENG_BE;

  constructor(
    private modalSvc: ModalService,
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private physicianApiSvc: PhysicianApiService,
    private shareDataSvc: ShareDataService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.modalSvc.dialogData$.pipe(take(1)).subscribe((data) => {
      this.modalData = data;
      this.createForm(this.modalData?.physicianDetails);
    });
    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => (this.selectedLanguage = lang));
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
      email: [physicianDetails?.email ?? '', []],
      rizivNumber: [physicianDetails?.rizivNumber ?? null, []],
      telephone: [physicianDetails?.telephone, [Validators.required, Validators.minLength(10)]],
      gsm: [physicianDetails?.gsm, []],
      address: [physicianDetails?.address, []],
      notifyDoctor: [!!physicianDetails?.notifyDoctor, []],
      status: [this.modalData.edit ? !!physicianDetails?.status : true, []],
    });
  }

  public closeModal(res: boolean) {
    this.modalSvc.close(res);
    // this.ngOnDestroy();
  }

  public savePhysician() {
    if (this.addPhysicianForm.invalid) {
      this.addPhysicianForm.markAllAsTouched();
      this.notificationSvc.showNotification(`${Translate.FormInvalid[this.selectedLanguage]}!`, NotificationType.WARNING);
      this.addPhysicianForm.updateValueAndValidity();
      return;
    }

    this.loading$$.next(true);

    const addPhysicianReqData: AddPhysicianRequestData = {
      ...this.formValues,
      status: this.formValues.status,
    };

    if (this.modalData?.physicianDetails?.id) {
      addPhysicianReqData.id = this.modalData.physicianDetails.id;
    }

    if (!addPhysicianReqData.email) {
      addPhysicianReqData.email = null;
    }



    if (this.modalData.edit) {
      this.physicianApiSvc
        .updatePhysician$(addPhysicianReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(
          () => {
            this.notificationSvc.showNotification(`${Translate.SuccessMessage.PhysicianUpdated[this.selectedLanguage]}!`);
            this.closeModal(true);
            this.loading$$.next(false);
          },
          () => this.loading$$.next(false),
        );
    } else {
      this.physicianApiSvc
        .addPhysician$(addPhysicianReqData)
        .pipe(takeUntil(this.destroy$$))
        .subscribe(
          () => {
            this.notificationSvc.showNotification(`${Translate.SuccessMessage.PhysicianAdded[this.selectedLanguage]}!`);
            this.closeModal(true);
            this.loading$$.next(false);
          },
          () => this.loading$$.next(false),
        );
    }
  }

  public handleEmailInput(e: Event): void {
    const inputText = (e.target as HTMLInputElement).value;

    if (!inputText) {
      return;
    }

    if (!inputText.match(EMAIL_REGEX)) {
      this.addPhysicianForm.get('email')?.setErrors({
        email: true,
      });
    } else {
      this.addPhysicianForm.get('email')?.setErrors(null);
    }
  }

  public handleNumberFocusOut($event: FocusEvent) {}
}
