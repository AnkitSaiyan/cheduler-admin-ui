import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {catchError, combineLatest, forkJoin, map, Observable, of, pipe, startWith, Subject, switchMap, tap} from 'rxjs';
import {environment} from 'src/environments/environment';
import {UserPropertiesPermitItem} from '../../shared/models/user-properties-permit-item.model';
import {UserInviteResponse} from '../../shared/models/user-invite-response.model';
import {UserProperties} from '../../shared/models/user-properties.model';
import {SchedulerUser, UserListResponse, UserRoleEnum} from '../../shared/models/user.model';
import {UserTenantItem} from '../../shared/models/user-tenant.model';
import {UserInvite} from '../../shared/models/invite.model';
import {LoaderService} from "./loader.service";
import {UserApiService} from "./user-api.service";
import {TenantService} from "./tenant.service";

@Injectable({
    providedIn: 'root',
})
export class UserManagementApiService {
    private baseUrl: string = environment.userManagementApiUrl;

    private refreshUserList$$ = new Subject<void>();

    private userIdToRoleMap = new Map<string, UserRoleEnum>();

    constructor(
        private httpClient: HttpClient,
        private loaderSvc: LoaderService,
        private userApiSvc: UserApiService,
        private tenantSvc: TenantService
    ) {
    }

    public get userList$(): Observable<UserListResponse> {
        return combineLatest([this.refreshUserList$$.pipe(startWith(''))]).pipe(
            switchMap(() => {
                this.loaderSvc.spinnerDeactivate();
                this.loaderSvc.activate();

                const tenantId = this.tenantSvc.currentTenant;

                return this.httpClient.get<UserListResponse>(`${this.baseUrl}/users?tenantId=${tenantId}`).pipe(
                    switchMap((userRes) => {
                        return of(null).pipe(
                            switchMap(() => {
                                return forkJoin([
                                    ...userRes.items.map((user) => {
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
                                        ) as Observable<SchedulerUser>;
                                    })
                                ]);
                            }),
                            map((users) => {
                                return {
                                    ...userRes,
                                    items: users
                                }
                            })
                        )
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

    public changeUserState(userId: string, state: boolean): Observable<any> {
        this.loaderSvc.activate();

        return this.httpClient.put<any>(`${this.baseUrl}/users/${userId}/state`, { accountEnabled: state }).pipe(
            tap(() => this.refreshUserList$$.next())
        );
    }

    public changeUsersStates(stateRequest: Array<{ id: string, accountEnabled: boolean }>): Observable<any> {
        this.loaderSvc.activate();

        return this.httpClient.put<any>(`${this.baseUrl}/users/state`, { users: stateRequest }).pipe(
            tap(() => this.refreshUserList$$.next())
        );
    }

    public getPatientByIds$(patientIds: string[]): Observable<SchedulerUser[]> {
        return this.httpClient.get<UserListResponse>(`${this.baseUrl}/users?ids=${patientIds}`).pipe(
            map((patientRes) => patientRes.items)
        );
    }
}

