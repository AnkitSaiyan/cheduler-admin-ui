import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from "rxjs";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { UserManagementApiService } from "../../../core/services/user-management-api.service";
import { DestroyableComponent } from "../destroyable.component";
import { AuthUser } from "../../models/user.model";
import { NotificationDataService } from "../../../core/services/notification-data.service";
import { Router } from "@angular/router";
import { ModalService } from "../../../core/services/modal.service";
import { ConfirmActionModalComponent, ConfirmActionModalData } from "../confirm-action-modal.component";
import { UserService } from "../../../core/services/user.service";
import { RouterStateService } from 'src/app/core/services/router-state.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import defaultLanguage from '../../../../../src/assets/i18n/en-BE.json';
import dutchLangauge from '../../../../../src/assets/i18n/nl-BE.json';
import { UserApiService } from 'src/app/core/services/user-api.service';
import { Translate } from '../../models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';

@Component({
	selector: 'dfm-complete-profile',
	templateUrl: './complete-profile.component.html',
	styleUrls: ['./complete-profile.component.scss'],
})
export class CompleteProfileComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public submitting$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	public user!: AuthUser;

	public completeProfileForm = new FormGroup({
		extension_PhoneNumber: new FormControl('', Validators.required),
		MobilePhone: new FormControl('', Validators.required),
		StreetAddress: new FormControl('', Validators.required),
		City: new FormControl('', Validators.required),
		Country: new FormControl('', Validators.required),
		PostalCode: new FormControl('', Validators.required),
	});
	public selectedLang: string = 'en-BE';

	siteDetails$$: BehaviorSubject<any>;

	constructor(
		private userManagementApiSvc: UserManagementApiService,
		private userSvc: UserService,
		private userApiSvc: UserApiService,
		private modalSvc: ModalService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private routerStateSvc: RouterStateService,
		private authSvc: AuthService,
		private translateService: TranslateService, // private landingService: LandingService,
		private shareDataSvc: ShareDataService,
	) {
		super();
		this.siteDetails$$ = new BehaviorSubject<any[]>([]);
		// this.landingService.siteFooterDetails$$.pipe(takeUntil(this.destroy$$)).subscribe((res) => {
		//   this.ngOnInit();
		// });
	}

	public ngOnInit(): void {
		this.userSvc.authUser$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (user) => (this.user = user as AuthUser),
		});
		this.shareDataSvc
			.getLanguage$()
			.pipe(take(1))
			.subscribe((value) => {
				this.selectedLang = value;
			});
	}
	changeLanguage(value) {
		this.shareDataSvc.setLanguage(value);
		if (value === 'en-BE') {
			this.translateService.setTranslation(value, defaultLanguage);
			this.translateService.setDefaultLang(value);
			// eslint-disable-next-line eqeqeq
		} else if (value === 'nl-BE') {
			this.translateService.setTranslation(value, dutchLangauge);
			this.translateService.setDefaultLang(value);
		}
		this.selectedLang = value;
	}

	public override ngOnDestroy(): void {
		super.ngOnDestroy();
	}

	public save(): void {
		if (this.completeProfileForm.invalid) {
			this.notificationSvc.showWarning(Translate.FormInvalidSimple[this.selectedLang]);
			this.completeProfileForm.markAllAsTouched();
			return;
		}

		this.submitting$$.next(true);

		this.userManagementApiSvc
			.patchUserProperties(this.user.id, {
				extension_ProfileIsIncomplete: false,
				...this.completeProfileForm.value,
			})
			.pipe(
				switchMap(() => this.userManagementApiSvc.createPropertiesPermit(this.user.id, this.user?.tenantIds[0])),
				switchMap(() => this.userSvc.initializeUser()),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (success) => {
					if (!success) {
						this.notificationSvc.showError(Translate.ErrorMessage.FailedToLoginLoggingOut[this.selectedLang]);
						this.userSvc.logout();
					}

					this.notificationSvc.showSuccess(Translate.SuccessMessage.ProfileSavedSuccessfully[this.selectedLang]);
					this.router.navigate(['/']);
				},
				error: () => {
					this.notificationSvc.showError(Translate.ErrorMessage.FailedToSaveProfile[this.selectedLang]);
					this.submitting$$.next(false);
				},
			});
	}

	public logout() {
		const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'LogoutConfirmation',
				bodyText: 'Areyousurewanttologout',
				confirmButtonText: 'Confirm',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		modalRef.closed
			.pipe(
				take(1),
				filter((res) => !!res),
			)
			.subscribe({
				next: () => this.userSvc.logout(),
			});
	}
	public items: any = [
		{
			name: 'EN',
			value: 'EN',
		},
		{
			name: 'NL',
			value: 'NL',
		},
	];
}














