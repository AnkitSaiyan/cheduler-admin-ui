import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import { SiteManagement, SiteManagementRequestData } from '../../../shared/models/site-management.model';
import { TimeDurationType } from '../../../shared/models/calendar.model';
import { NotificationDataService } from '../../../core/services/notification-data.service';
import { SiteManagementApiService } from '../../../core/services/site-management-api.service';
import { DestroyableComponent } from '../../../shared/components/destroyable.component';

interface FormValues {
  name: string;
  disableAppointment: boolean;
  disableWarningText: string;
  heading: string;
  subHeading: string;
  bodyText: string;
  doctorReferringConsent: 0 | 1;
  cancelAppointmentTime: number;
  cancelAppointmentType: TimeDurationType;
  address: string;
  email: string;
  telephone: number;
  file: { file: Blob; loading: boolean };
  isSlotsCombinable: boolean;
  reminderTime: number;
  reminderTimeType: TimeDurationType;
}

@Component({
  selector: 'dfm-site-management',
  templateUrl: './site-management.component.html',
  styleUrls: ['./site-management.component.scss'],
})
export class SiteManagementComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public siteManagementForm!: FormGroup;

  public siteManagementData$$ = new BehaviorSubject<SiteManagement | undefined>(undefined);

  public timeDurations: { name: TimeDurationType; value: TimeDurationType }[] = [
    {
      name: 'Minutes',
      value: 'Minutes',
    },
    {
      name: 'Hours',
      value: 'Hours',
    },
    {
      name: 'Days',
      value: 'Days',
    },
  ];

  constructor(private fb: FormBuilder, private notificationSvc: NotificationDataService, private siteManagementApiSvc: SiteManagementApiService) {
    super();
  }

  public ngOnInit(): void {
    this.siteManagementApiSvc.siteManagementData$.pipe(takeUntil(this.destroy$$)).subscribe((siteManagementData) => {
      this.siteManagementData$$.next(siteManagementData ?? {});
      this.createForm(siteManagementData);
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get formValues(): FormValues {
    return this.siteManagementForm.value;
  }

  private createForm(siteManagementData?: SiteManagement | undefined): void {
    let duration = 0;
    let durationType: TimeDurationType = 'Hours';
    let introductoryTextObj;

    if (siteManagementData) {
      if (siteManagementData.cancelAppointmentTime) {
        duration = siteManagementData.cancelAppointmentTime;
        if (duration < 1) {
          duration *= 60;
          durationType = 'Minutes';
        } else if (duration >= 24) {
          duration /= 24;
          durationType = 'Days';
        }
      }

      if (siteManagementData.introductoryText) {
        try {
          introductoryTextObj = JSON.parse(siteManagementData.introductoryText);
        } catch (e) {
          console.log(e);
        }
      }
    }

    this.siteManagementForm = this.fb.group({
      name: [siteManagementData?.name ?? '', [Validators.required]],
      file: [{ file: siteManagementData?.logo, loading: false }, [Validators.required]],
      introductoryText: [siteManagementData?.introductoryText ?? '', []],
      heading: [introductoryTextObj?.heading ?? '', [Validators.required]],
      subHeading: [introductoryTextObj?.subHeading ?? '', [Validators.required]],
      bodyText: [introductoryTextObj?.bodyText ?? '', [Validators.required]],
      disableAppointment: [+!!siteManagementData?.disableAppointment, [Validators.required]],
      disableWarningText: [siteManagementData?.disableWarningText ?? '', []],
      doctorReferringConsent: [siteManagementData?.doctorReferringConsent, [Validators.required]],
      cancelAppointmentTime: [duration, []],
      cancelAppointmentType: [durationType, []],
      email: [siteManagementData?.email ?? '', []],
      telephone: [siteManagementData?.telephone, [Validators.required]],
      address: [siteManagementData?.address, [Validators.required]],
      isSlotsCombinable: [+!!siteManagementData?.isSlotsCombinable, [Validators.required]],
      reminderTime: [duration, []],
      reminderTimeType: [durationType, []],
    });
  }

  public saveSiteManagementData(): void {
    if (this.siteManagementForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.siteManagementForm.updateValueAndValidity();
      return;
    }

    const { heading, subHeading, bodyText, file, cancelAppointmentType, isSlotsCombinable, ...rest } = this.formValues;

    const requestData: SiteManagementRequestData = {
      ...rest,
      introductoryText: '',
      file: file.file,
      disableWarningText: rest.disableAppointment ? rest.disableWarningText : null,
      cancelAppointmentTime: (function () {
        switch (cancelAppointmentType) {
          case 'Minutes':
            return rest.cancelAppointmentTime / 60;
          case 'Days':
            return rest.cancelAppointmentTime * 24;
          default:
            return rest.cancelAppointmentTime;
        }
      })(),
      isSlotsCombinable: false
    };

    requestData.introductoryText = JSON.stringify({
      heading,
      subHeading,
      bodyText,
    });

    if (this.siteManagementData$$.value && this.siteManagementData$$.value?.id) {
      requestData.id = this.siteManagementData$$.value.id;
    }

    console.log(requestData);

    this.siteManagementApiSvc
      .saveSiteManagementData$(requestData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification(`${this.siteManagementData$$.value?.id ? 'Changes updated' : 'Saved'} successfully`);
      });
  }

  public onFileChange(event: Event) {
    const { files } = event.target as HTMLInputElement;

    if (files && files?.length) {
      const reader = new FileReader();
      reader.readAsDataURL(files[0]);
      const fileControl = this.siteManagementForm.get('file');
      fileControl?.setValue({
        file: null,
        loading: true,
      });

      reader.onload = (e: any) => {
        fileControl?.setValue({
          file: reader.result,
          loading: false,
        });
      };
    }
  }

  public removeFile() {
    this.siteManagementForm.get('file')?.setValue({
      ...this.formValues.file,
      file: null,
    });
  }
}
