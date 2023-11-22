import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { InteractionType } from '@azure/msal-browser';
import { EXT_Patient_Tenant } from 'src/app/shared/utils/const';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';
import { PermissionService } from './permission.service';
import { NotificationDataService } from './notification-data.service';
import { UserManagementApiService } from './user-management-api.service';
import { AuthUser } from '../../shared/models/user.model';

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

	public initializeUser(): Observable<boolean> {
		const user = this.msalService.instance.getActiveAccount();
		const userId = user?.localAccountId ?? '';

		GeneralUtils.saveSessionExpTime();

		const tenantIds = (user?.idTokenClaims as any)?.extension_Tenants?.split(',');

		if (tenantIds?.some((value) => value === EXT_Patient_Tenant)) {
			this.notificationSvc.showError(`you don't have permission to view this page`);
			return of(false);
		}

		return this.userManagementApiService.getTenantId().pipe(
			switchMap(() => {
				return this.userManagementApiService.getUserProperties(userId).pipe(
					map((res: any) => {
						try {
							const tenants = ((user?.idTokenClaims as any).extension_Tenants as string).split(',');
							if (tenants.length === 0) {
								return false;
							}

							this.authUser$$.next(new AuthUser(res.mail, res.givenName, res.id, res.surname, res.displayName, res.email, res.properties, tenants));

							return true;
						} catch (error) {
							return false;
						}
					}),
					tap((res) => {
						// Complete Profile if not completed

						if (!res) {
							return;
						}

						const user = this.authUser$$.value;
						if (!user) {
							return;
						}

						if (user.properties['extension_ProfileIsIncomplete']) {
							this.router.navigate(['/complete-profile']);
						}
					}),
					catchError((err) => of(false)),
				);
			}),
			catchError(() => of(false)),
		);
	}

	public logout() {
		sessionStorage.clear();
		localStorage.removeItem('sessionExp');
		this.removeUser();
		this.msalService.logoutRedirect().pipe(take(1)).subscribe();
	}

	public removeUser() {
		this.authUser$$.next(undefined);
		this.permissionSvc.removePermissionType();
	}
}
