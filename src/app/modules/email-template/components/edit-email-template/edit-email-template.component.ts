import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import { BehaviorSubject, filter, map, switchMap, takeUntil } from 'rxjs';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { EMAIL_TEMPLATE_ID } from '../../../../shared/utils/const';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { EmailTemplateApiService } from 'src/app/core/services/email-template-api.service';
import { Email } from 'src/app/shared/models/email-template.model';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { Status } from 'src/app/shared/models/status.model';
import { ShareDataService } from '../../../../core/services/share-data.service';
import { Translate } from '../../../../shared/models/translate.model';
import { NotificationType } from 'diflexmo-angular-design-dev';
import { ActivatedRoute, Router } from '@angular/router';

interface FormValues {
	title: string;
	subject: string;
	status: Status;
	content: string;
	adminContent: string;
	id: number;
}

@Component({
	selector: 'dfm-add-appointment',
	templateUrl: './edit-email-template.component.html',
	styleUrls: ['./edit-email-template.component.scss'],
})
export class EditEmailTemplateComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public emailTemplateForm!: FormGroup;

	public email$$ = new BehaviorSubject<Email>({} as Email);

	public loading$$ = new BehaviorSubject(false);

	public submitting$$ = new BehaviorSubject<boolean>(false);

	public edit = false;

	public content = '';
	adminContent = '';

	public contentConfig: AngularEditorConfig = {
		editable: true,
		spellcheck: true,
		height: '15rem',
		minHeight: '5rem',
		placeholder: 'Enter Text Here....',
		translate: 'no',
		defaultParagraphSeparator: 'p',
		defaultFontName: 'Arial',
		customClasses: [
			{
				name: 'quote',
				class: 'quote',
			},
			{
				name: 'redText',
				class: 'redText',
			},
			{
				name: 'titleText',
				class: 'titleText',
				tag: 'h1',
			},
		],
	};

	adminContentConfig: AngularEditorConfig = {
		editable: true,
		spellcheck: true,
		height: '15rem',
		minHeight: '5rem',
		placeholder: 'Enter Text Here...',
		translate: 'no',
		defaultParagraphSeparator: 'p',
		defaultFontName: 'Arial',
		customClasses: [
			{
				name: 'quote',
				class: 'quote',
			},
			{
				name: 'redText',
				class: 'redText',
			},
			{
				name: 'titleText',
				class: 'titleText',
				tag: 'h1',
			},
		],
	};

	private selectedLang!: string;

	constructor(
		private fb: FormBuilder,
		private notificationSvc: NotificationDataService,
		private emailTemplateApiSvc: EmailTemplateApiService,
		private routerStateSvc: RouterStateService,
		private shareDataSvc: ShareDataService,
		private router: Router,
		private route: ActivatedRoute,
	) {
		super();
	}

	public ngOnInit(): void {
		this.createForm();

		this.route.params
			.pipe(
				filter((params) => params[EMAIL_TEMPLATE_ID]),
				map((params) => params[EMAIL_TEMPLATE_ID]),
				filter((emailTemplateId: string) => !!emailTemplateId),
				switchMap((emailTemplateId) => this.emailTemplateApiSvc.getEmailTemplateById(+emailTemplateId)),
				takeUntil(this.destroy$$),
			)
			.subscribe((emailTemplate) => {
				this.email$$.next(emailTemplate);
				this.updateForm(emailTemplate);
			});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => (this.selectedLang = lang));
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
			status: [Status.Active, [Validators.required]],
			content: ['', [Validators.required]],
			adminContent: ['', [Validators.required]],
		});
	}

	private updateForm(email: Email | undefined) {
		this.emailTemplateForm.patchValue({
			title: email?.title ?? null,
			subject: email?.subject ?? null,
			status: email?.status ?? 0,
			content: email?.content ?? null,
			adminContent: email?.adminContent ?? null,
		});
	}

	public saveEmailTemplate(): void {
		if (this.emailTemplateForm.invalid) {
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			this.emailTemplateForm.markAllAsTouched();
			return;
		}

		this.submitting$$.next(true);

		const { ...rest } = this.formValues;

		const requestData = rest;

		if (this.email$$.value?.id) {
			requestData.id = this.email$$.value.id;
		}

		console.log('requestData: ', requestData);

		this.emailTemplateApiSvc
			.updateEmailTemplate(requestData)
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: () => {
					this.notificationSvc.showNotification(Translate.SuccessMessage.EmailTemplateUpdated[this.selectedLang]);
					this.submitting$$.next(false);
					this.router.navigate(['../../'], { relativeTo: this.route });
				},
				error: () => this.submitting$$.next(false),
			});
	}
}



