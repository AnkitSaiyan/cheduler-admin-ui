import {Inject, Injectable} from '@angular/core';
import {BehaviorSubject, catchError, map, Observable, of, tap} from "rxjs";
import {AuthUser} from "../../shared/models/user.model";
import {MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalService} from "@azure/msal-angular";
import {UserManagementApiService} from "./user-management-api.service";
import {Router} from "@angular/router";
import {InteractionType} from "@azure/msal-browser";
import {PermissionService} from "./permission.service";

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
    ) {
    }

    public get authUser$(): Observable<AuthUser | undefined> {
        return this.authUser$$.asObservable();
    }

    public getCurrentUser(): AuthUser | undefined {
        return this.authUser$$.value;
    }

    public initializeUser(): Observable<boolean> {
        const user = this.msalService.instance.getActiveAccount();
        const userId = user?.localAccountId ?? '';

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
                    // this.authUser$$.next(new AuthUser(user.mail, user.givenName, user.id, user.surname, user.displayName, user.email, {}, []))
                    this.router.navigate(['/complete-profile']);
                }
            }),
            catchError((err) => of(false)),
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

