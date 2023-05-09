import {Inject, Injectable} from '@angular/core';
import {BehaviorSubject, catchError, map, Observable, of, switchMap, tap, throwError} from "rxjs";
import {AuthUser} from "../../shared/models/user.model";
import {MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalService} from "@azure/msal-angular";
import {UserManagementApiService} from "./user-management-api.service";
import {Router} from "@angular/router";
import {InteractionType} from "@azure/msal-browser";
import {PermissionService} from "./permission.service";
import {ErrLoginFailed, ErrNoAccessPermitted, EXT_Admin_Tenant, EXT_Patient_Tenant} from 'src/app/shared/utils/const';
import { NotificationDataService } from './notification-data.service';
import {error} from "@angular/compiler-cli/src/transformers/util";

@Injectable({
	providedIn: 'root',
})
export class UserService {
	private authUser$$: BehaviorSubject<AuthUser | undefined> = new BehaviorSubject<AuthUser | undefined>(undefined);

	constructor(
		@Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
		private msalService: MsalService,
		private userManagementApiService: UserManagementApiService,
		private permissionSvc: PermissionService,
		private router: Router,
		private notificationSvc: NotificationDataService,
	) {}

	public get authUser$(): Observable<AuthUser | undefined> {
		return this.authUser$$.asObservable();
	}

	public getCurrentUser(): AuthUser | undefined {
		return this.authUser$$.value;
	}

	public initializeUser(): Observable<any> {
		const user = this.msalService.instance.getActiveAccount();

		return of(user).pipe(
			switchMap((u) => {
				console.log(u);

				const userId = u?.localAccountId ?? '';

				if (!userId) {
					throw Error(ErrLoginFailed);
				}

				const tenantIds = (user?.idTokenClaims as any)?.extension_Tenants?.split(',');

				const isPermitted = !tenantIds.length || !tenantIds?.some((value) => value === EXT_Admin_Tenant);

				if (!isPermitted) {
					throw Error(ErrNoAccessPermitted);
				}

				return this.userManagementApiService.getUserProperties(userId).pipe(
					map((res: any) => {
						this.authUser$$.next(new AuthUser(res.mail, res.givenName, res.id, res.surname, res.displayName, res.email, res.properties, tenantIds));

						if (!this.authUser$$.value) {
							throw Error(ErrLoginFailed);
						}

						if (this.authUser$$.value['extension_ProfileIsIncomplete']) {
							this.router.navigate(['/complete-profile']);
						}

						return;
					}),
					catchError((err) => throwError(err)),
				);
			})
		);
	}

	public logout() {
		if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
			this.msalService.logoutPopup({
				mainWindowRedirectUri: '/',
			});
		} else {
			this.msalService.logoutRedirect();
		}

		setTimeout(() => this.removeUser(), 500);
	}

	public removeUser() {
		this.authUser$$.next(undefined);
		this.permissionSvc.removePermissionType();
	}
}









