import {Component, OnDestroy, OnInit} from '@angular/core';
import {NotificationType} from 'diflexmo-angular-design';
import {BehaviorSubject, catchError, Observable, switchMap, take, takeUntil} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {ModalService} from '../../../../core/services/modal.service';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {User, UserRoleEnum, UserType} from '../../../../shared/models/user.model';
import {getUserTypeEnum} from '../../../../shared/utils/getEnums';
import {DUTCH_BE, EMAIL_REGEX, ENG_BE, Statuses, StatusesNL} from '../../../../shared/utils/const';

import {Translate} from '../../../../shared/models/translate.model';
import {UserApiService} from "../../../../core/services/user-api.service";
import {NameValue} from "../../../../shared/components/search-modal.component";
import {UserManagementApiService} from "../../../../core/services/user-management-api.service";
import {environment} from "../../../../../environments/environment";
import {AuthService} from "../../../../core/services/auth.service";
import {MsalService} from "@azure/msal-angular";
import {Permission} from "../../../../shared/models/permission.model";
import {PermissionService} from "../../../../core/services/permission.service";
import {GeneralUtils} from "../../../../shared/utils/general.utils";

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

	public readonly Permission = Permission;

	public permissionType!: UserRoleEnum;

	constructor(
		private modalSvc: ModalService,
		private fb: FormBuilder,
		private notificationSvc: NotificationDataService,
		private shareDataSvc: ShareDataService,
		private userApiSvc: UserApiService,
		private userManagementApiSvc: UserManagementApiService,
		private authSvc: AuthService,
		private msalService: MsalService,
		private permissionSvc: PermissionService,
	) {
		super();

		this.modalSvc.dialogData$.pipe(take(1)).subscribe({
			next: (data) => {
				this.modalData = data;
				this.createForm(this.modalData?.userDetails);
			},
		});
	}

	public ngOnInit(): void {
		this.permissionSvc.permissionType$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (permissionType) => {
				this.permissionType = permissionType;
				if (permissionType === UserRoleEnum.GeneralUser) {
					this.addUserForm.patchValue({
						userType: UserType.General,
					});
				}
			},
		});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => {
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
				},
			});

		const userId = this.msalService.instance.getActiveAccount()?.localAccountId ?? '';
		this.userManagementApiSvc
			.getUserTenantsList(userId)
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (tenants) => {
					this.userTenants = tenants.map(({ id, name }) => ({ name, value: id.toString() }));
				},
			});

		this.userRoles = this.userApiSvc.getRoleTypes();
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
					disabled: this.modalData.edit || this.permissionType === UserRoleEnum.GeneralUser,
				},
				[Validators.required],
			],
			firstname: [userDetails?.firstname ?? '', [Validators.required]],
			lastname: [userDetails?.lastname ?? '', [Validators.required]],
			email: [userDetails?.email ?? '', []],
			userRole: [null, []],
			tenantId: [null, []],
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



		let addUserObservable$: Observable<any>;

		if ([this.formValues.userType, this.modalData?.userDetails?.userType].includes(UserType.Scheduler)) {
			let roleName: UserRoleEnum;
			switch (this.formValues.userRole) {
				case UserRoleEnum.Admin:
				case UserRoleEnum.GeneralUser:
					roleName = UserRoleEnum.Admin;
					break;
				case UserRoleEnum.Reader:
					roleName = UserRoleEnum.Reader;
			}

			addUserObservable$ = this.userManagementApiSvc
				.createUserInvite({
					givenName: this.formValues.firstname,
					surName: this.formValues.lastname,
					email: this.formValues.email,
					roleName,
					contextTenantId: this.userManagementApiSvc.tenantId,
					redirect: {
						redirectUrl: environment.redirectUrl,
						clientId: environment.authClientId,
					},
				})
				.pipe(switchMap((user) => this.userApiSvc.assignUserRole(user.id, this.formValues.userRole)));
		} else {
			addUserObservable$ = this.userApiSvc.upsertUser$({
				firstname: this.formValues.firstname,
				lastname: this.formValues.lastname,
				email: this.formValues.email ?? null,
				userType: this.modalData.edit ? this.modalData.userDetails.userType : this.formValues.userType,
				...(this.modalData.userDetails ? { id: this.modalData.userDetails.id } : {}),
			}, 'user');
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
			error: (err) => this.loading$$.next(false),
		});
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
	protected readonly UserRoleEnum = UserRoleEnum;
}
