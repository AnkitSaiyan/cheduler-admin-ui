import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, map, switchMap, takeUntil } from 'rxjs';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RoomType } from '../../../../shared/models/rooms.model';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { EMAIL_TEMPLATE_ID, COMING_FROM_ROUTE, EDIT } from '../../../../shared/utils/const';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { EmailTemplateApiService } from 'src/app/core/services/email-template-api.service';
import { Email } from 'src/app/shared/models/email-template.model';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { Status, StatusToName } from 'src/app/shared/models/status.model';

interface FormValues {
  title: string;
  subject: string;
  status: Status;
  content: string;
  adminContent: string;
  id : number;
}

@Component({
  selector: 'dfm-add-appointment',
  templateUrl: './edit-email.component.html',
  styleUrls: ['./edit-email.component.scss'],
})
export class EditEmailComponent extends DestroyableComponent implements OnInit, AfterViewInit, OnDestroy {
  public emailTemplateForm!: FormGroup;

  public email$$ = new BehaviorSubject<Email | undefined>(undefined);

  public loading$$ = new BehaviorSubject(false);

  public edit = false;


  content = '';
  adminContent = '';

  contentConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '15rem',
    minHeight: '5rem',
    placeholder: 'Enter text here...',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    customClasses: [
      {
        name: "quote",
        class: "quote",
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: "titleText",
        class: "titleText",
        tag: "h1",
      },
    ]
  };

  adminContentConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '15rem',
    minHeight: '5rem',
    placeholder: 'Enter text here...',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    customClasses: [
      {
        name: "quote",
        class: "quote",
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: "titleText",
        class: "titleText",
        tag: "h1",
      },
    ]
  };

  constructor(
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private emailTemplateApiSvc: EmailTemplateApiService,
    private routerStateSvc: RouterStateService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.createForm();

    this.routerStateSvc
      .listenForParamChange$(EMAIL_TEMPLATE_ID)
      .pipe(
        filter((emailID: string) => {
          console.log('emailID in filter: ', emailID);
          if (!emailID) {
            this.email$$.next({} as Email);
          }
          return !!emailID;
        }),
        switchMap((emailID) => {
          console.log('emailID: ', emailID);
          return this.emailTemplateApiSvc.getEmailTemplateById(+emailID);
        }),
        debounceTime(300),
        takeUntil(this.destroy$$),
      )
      .subscribe((emailTemplate) => {
        console.log('emailTemplate: ', emailTemplate);
        this.email$$.next(emailTemplate ?? ({} as Email));
        this.updateForm(emailTemplate);
      });
  }

  public ngAfterViewInit() {
    // this.updateForm(this.email$$.value);
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get formValues(): FormValues {
    return this.emailTemplateForm?.value;
  }

  private createForm(): void {
    this.emailTemplateForm = this.fb.group({
      title: ['', [Validators.required]],
      subject: ['', [Validators.required]],
      status: [1, [Validators.required]],
      content: ['', [Validators.required]],
      adminContent: ['', [Validators.required]]
    });
  }

  private updateForm(email: Email | undefined) {
    this.emailTemplateForm.patchValue({
      title: email?.title ?? null,
      subject: email?.subject ?? null,
      status: email?.status?? 0,
      content: email?.content ?? null,
      adminContent: email?.adminContent ?? null,
    });
  }

  public saveEmailTemplate(emailTemplate: any): void {
    console.log('emailTemplate: ', emailTemplate);

    // if (this.emailTemplateForm.invalid) {
    //   this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
    //   this.emailTemplateForm.markAsDirty({ onlySelf: true });
    //   return;
    // }

    const { ...rest } = this.formValues;

    const requestData = rest;
    
    emailTemplate.subscribe((data: any) => {
      requestData.id = data.id;
    })
    this.emailTemplateApiSvc
      .updateEmailTemplate(requestData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification(`Email template updated successfully`);
      });
    console.log('requestData: ', requestData);
  }
}

