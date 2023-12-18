import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { EXT_PATIENT_TENANT } from 'src/app/shared/utils/const';
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

		const tenantIds = ((user?.idTokenClaims as any)?.extension_Tenants || '').split(',');

		if (tenantIds.includes(EXT_PATIENT_TENANT)) {
			this.handlePermissionError();
			return of(false);
		}

		return this.userManagementApiService.getTenantId().pipe(
			switchMap(() => this.userManagementApiService.getUserProperties(userId)),
			map((res: any) => this.handleUserProperties(res, user)),
			tap((res) => this.handleUserProfileCompletion(res)),
			catchError(() => of(false)),
		);
	}

	private handlePermissionError(): void {
		this.notificationSvc.showError(`You don't have permission to view this page`);
	}

	private handleUserProperties(res: any, user: any): boolean {
		try {
			const tenants = (((user.idTokenClaims).extension_Tenants as string) || '').split(',');

			if (tenants.length === 0) {
				return false;
			}

			const authUser = new AuthUser(res.mail, res.givenName, res.id, res.surname, res.displayName, res.email, res.properties, tenants);

			this.authUser$$.next(authUser);

			return true;
		} catch (error) {
			return false;
		}
	}

	private handleUserProfileCompletion(hasUser: boolean): void {
		if (hasUser) {
			const users = this.authUser$$.value;

			if (users && users.properties['extension_ProfileIsIncomplete']) {
				this.router.navigate(['/complete-profile']);
			}
		}
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
