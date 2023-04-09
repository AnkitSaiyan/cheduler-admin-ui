// import { UserTenantItem } from './../models/user-tenant.model';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {catchError, combineLatest, forkJoin, map, Observable, of, startWith, Subject, switchMap, tap} from 'rxjs';
import {environment} from 'src/environments/environment';
import {UserPropertiesPermitItem} from '../../shared/models/user-properties-permit-item.model';
import {UserInviteResponse} from '../../shared/models/user-invite-response.model';
import {UserProperties} from '../../shared/models/user-properties.model';
import {SchedulerUser, UserRoleEnum} from '../../shared/models/user.model';
import {UserTenantItem} from '../../shared/models/user-tenant.model';
import {UserInvite} from '../../shared/models/invite.model';
import {LoaderService} from "./loader.service";
import {UserApiService} from "./user-api.service";

@Injectable({
    providedIn: 'root',
})
export class UserManagementApiService {
    private baseUrl: string = environment.userManagementApiUrl;

    private refreshUserList$$ = new Subject<void>();

    private userIdToRoleMap = new Map<string, UserRoleEnum>();

    constructor(private httpClient: HttpClient, private loaderSvc: LoaderService, private userApiSvc: UserApiService) {
    }

    public get userList$(): Observable<SchedulerUser[]> {
        this.loaderSvc.spinnerDeactivate();
        this.loaderSvc.activate();

        return combineLatest([this.refreshUserList$$.pipe(startWith(''))]).pipe(
            switchMap(() => {
                return this.httpClient.get<SchedulerUser[]>(`${this.baseUrl}/users`).pipe(
                    switchMap((users) => {
                        return forkJoin([
                            ...users.map((user) => {
                                const userRole = this.userIdToRoleMap.get(user.id);
                                if (userRole) {
                                    user.userRole = userRole;
                                    return of(user);
                                }

                                return this.userApiSvc.getUserRole(user.id).pipe(
                                    map((role) => {
                                        user.userRole = role ?? '' as UserRoleEnum;
                                        return user;
                                    }),
                                    tap(({id, userRole}) => this.userIdToRoleMap.set(id, userRole)),
                                    catchError(() => of({...user, userRole: ''})),
                                ) as Observable<SchedulerUser>
                            })
                        ]);
                    }),
                    tap(() => {
                        this.loaderSvc.deactivate();
                        this.loaderSvc.spinnerDeactivate();
                    }),
                    catchError(() => ([]))
                );
            })
        );
    }

    public getUserProperties(userId: string): Observable<UserProperties> {
        return this.httpClient.get<UserProperties>(`${this.baseUrl}/users/${userId}/properties`);
    }

    public patchUserProperties(userId: string, properties: Record<string, any>) {
        return this.httpClient.patch(`${this.baseUrl}/users/${userId}/properties`, {properties});
    }

    public getUserById(userId: string): Observable<SchedulerUser> {
        this.loaderSvc.spinnerDeactivate();
        this.loaderSvc.activate();

        return this.httpClient.get<SchedulerUser>(`${this.baseUrl}/users/${userId}`).pipe(tap(() => {
            this.loaderSvc.deactivate();
            this.loaderSvc.spinnerDeactivate();
        }));
    }

    public createUserInvite(userInvite: UserInvite): Observable<UserInviteResponse> {
        return this.httpClient.post<UserInviteResponse>(`${this.baseUrl}/users/invites`, userInvite);
    }

    public getPropertiesPermits(userId: string): Observable<UserPropertiesPermitItem[]> {
        return this.httpClient.get<UserPropertiesPermitItem[]>(`${this.baseUrl}/users/${userId}/properties/permits`);
    }

    public createPropertiesPermit(userId: string, tenantId: string): Observable<Record<string, string>> {
        return this.httpClient.post<Record<string, string>>(`${this.baseUrl}/users/${userId}/properties/permit`, {tenantId});
    }

    public revokePropertiesPermit(userId: string, tenantId: string): Observable<any> {
        return this.httpClient.post<any>(`${this.baseUrl}/users/${userId}/properties/revoke`, {tenantId});
    }

    public getTenantGlobalPermissions(userId: string, tenantId: string): Observable<string[]> {
        return this.httpClient.get<string[]>(`${this.baseUrl}/users/${userId}/tenants/${tenantId}/global-permissions`);
    }

    public getUserTenantsList(userId: string): Observable<UserTenantItem[]> {
        return this.httpClient.get<UserTenantItem[]>(`${this.baseUrl}/users/${userId}/tenants`);
    }

    public deleteUser(userId: string): Observable<{}> {
        return this.httpClient.delete<{}>(`${this.baseUrl}/users/${userId}`).pipe(tap(() => {
            this.refreshUserList$$.next();

            if (this.userIdToRoleMap.has(userId)) {
                this.userIdToRoleMap.delete(userId);
            }
        }));
    }
}

