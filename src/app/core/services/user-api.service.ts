import {Injectable, OnDestroy} from '@angular/core';
import {
    BehaviorSubject,
    catchError,
    combineLatest,
    filter,
    map,
    Observable,
    of,
    startWith,
    Subject,
    switchMap,
    takeUntil,
    tap
} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {MsalService} from '@azure/msal-angular';
import {AuthUser, User, UserRoleEnum, UserType} from '../../shared/models/user.model';
import {UserManagementApiService} from './user-management-api.service';
import {NameValue} from "../../shared/components/search-modal.component";
import {PermissionService} from "./permission.service";
import {environment} from "../../../environments/environment";
import {LoaderService} from "./loader.service";
import {BaseResponse} from "../../shared/models/base-response.model";
import {ChangeStatusRequestData} from "../../shared/models/status.model";
import {AddStaffRequestData, StaffType} from "../../shared/models/staff.model";
import {Translate} from "../../shared/models/translate.model";
import {ShareDataService} from "./share-data.service";
import {DestroyableComponent} from "../../shared/components/destroyable.component";
import {Router} from "@angular/router";

@Injectable({
    providedIn: 'root',
})
export class UserApiService extends DestroyableComponent implements OnDestroy {
    public userIdToRoleMap = new Map<string, UserRoleEnum>();
    private readonly userUrl = `${environment.schedulerApiUrl}/user`;
    private authUser$$: BehaviorSubject<AuthUser | undefined> = new BehaviorSubject<AuthUser | undefined>(undefined);
    private selectedLang$$: BehaviorSubject<string> = new BehaviorSubject<string>('');
    private refreshUsers$$: Subject<void> = new Subject<void>();
    private readonly userRoles: NameValue[] = [
        {
            name: 'Admin',
            value: UserRoleEnum.Admin
        },
        {
            name: 'General User',
            value: UserRoleEnum.GeneralUser
        },
        {
            name: 'Reader',
            value: UserRoleEnum.Reader
        }
    ];
    private readonly staffTypes$$ = new BehaviorSubject<NameValue[]>([
        {
            name: StaffType.Radiologist,
            value: StaffType.Radiologist,
        },
        {
            name: StaffType.Nursing,
            value: StaffType.Nursing,
        },
        {
            name: StaffType.Assistant,
            value: StaffType.Assistant,
        },
        {
            name: StaffType.Secretary,
            value: StaffType.Secretary,
        },
    ]);

    constructor(
        private http: HttpClient,
        private msalService: MsalService,
        private UserManagementApiService: UserManagementApiService,
        private permissionSvc: PermissionService,
        private loaderSvc: LoaderService,
        private shareDataSvc: ShareDataService,
        private router: Router
    ) {
        super();

        this.shareDataSvc
            .getLanguage$()
            .pipe(takeUntil(this.destroy$$))
            .subscribe({
                next: (lang) => this.selectedLang$$.next(lang)
            });
    }

    public get authUser$(): Observable<AuthUser | undefined> {
        return this.authUser$$.asObservable();
    }

    public get generalUsers$(): Observable<User[]> {
        return this.getUsersByType(UserType.General);
    }

    public get staffs$(): Observable<User[]> {
        return this.getUsersByType(UserType.Assistant, UserType.Radiologist, UserType.Secretary, UserType.Nursing);
    }

    public get allGeneralUsers$(): Observable<User[]> {
        return this.fetchAllUsers$.pipe(map((users) => {
            return users.filter((user) => user.userType === UserType.General);
        }));
    }

    public get allStaffs$(): Observable<User[]> {
        return this.fetchAllUsers$.pipe(map((users) => {
            return users.filter((user) => [UserType.Nursing, UserType.Assistant, UserType.Radiologist, UserType.Secretary].includes(user.userType));
        }));
    }

    public get staffTypes$(): Observable<NameValue[]> {
        return combineLatest([this.selectedLang$$.pipe(startWith(''))]).pipe(
            switchMap(([lang]) =>
                this.staffTypes$$.asObservable().pipe(
                    filter(() => !!lang),
                    map((staffTypes) =>
                        staffTypes.map((staffType) => ({
                            ...staffType,
                            name: Translate.StaffTypes[staffType.name][lang],
                        })),
                    ),
                ),
            ),
        );
    }

    private get fetchAllUsers$(): Observable<User[]> {
        this.loaderSvc.activate();
        this.loaderSvc.spinnerActivate();

        return combineLatest([this.refreshUsers$$.pipe(startWith(''))]).pipe(
            switchMap(() => {
                return this.http.get<BaseResponse<User[]>>(`${environment.schedulerApiUrl}/common/getusers`).pipe(
                    map((res) => res?.data?.map((u) => ({...u, fullName: `${u.firstname} ${u.lastname}`}))),
                    tap(() => {
                        this.loaderSvc.deactivate();
                        this.loaderSvc.spinnerDeactivate();
                    }),
                );
            }),
        );
    }

    private get users$(): Observable<User[]> {
        this.loaderSvc.activate();

        return combineLatest([this.refreshUsers$$.pipe(startWith(''))]).pipe(
            switchMap(() => {
                return this.http.get<BaseResponse<User[]>>(this.userUrl).pipe(
                    map((res) => {
                        return res?.data?.map((user) => ({
                            ...user,
                            fullName: `${user.firstname} ${user.lastname}`
                        }));
                    }),
                    tap(() => this.loaderSvc.deactivate()),
                    catchError(() => of([]))
                );
            }),
        );
    }

    public removeUser() {
        this.authUser$$.next(undefined);
        this.permissionSvc.removePermissionType();
    }

    public getRoleTypes(): NameValue[] {
        return [...this.userRoles];
    }

    public getCurrentUserRole$(userId: string): Observable<UserRoleEnum> {
        if (this.userIdToRoleMap.has(userId)) {
            return of(this.userIdToRoleMap.get(userId) as UserRoleEnum);
        }

        return this.http.get<UserRoleEnum[]>(`${environment.schedulerApiUrl}/userroles?userId=${userId}`).pipe(
            map((roles) => {
                console.log('roles', roles);
                return roles[0] ?? '';
            }),
            tap((role) => this.userIdToRoleMap.set(userId, role as UserRoleEnum)),
        );
    }

    public initializeUser(): Observable<boolean> {
        const user = this.msalService.instance.getActiveAccount();
        const userId = user?.localAccountId ?? '';

        return this.UserManagementApiService.getUserProperties(userId).pipe(
            switchMap((res: any) => {
                try {
                    const tenants = ((user?.idTokenClaims as any).extension_Tenants as string).split(',');
                    if (tenants.length === 0) {
                        return of(false);
                    }

                    return this.getCurrentUserRole$(userId).pipe(
                        map((role) => {
                            console.log(role, 'role')
                            if (!role) {
                                return false;
                            }
                            this.permissionSvc.setPermissionType(role as UserRoleEnum);
                            this.authUser$$.next(new AuthUser(res.mail, res.givenName, res.id, res.surname, res.displayName, res.email, res.properties, tenants));
                            return true;
                        }),
                        catchError((err) => of(false))
                    )
                } catch (error) {
                    return of(false);
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
                    this.authUser$$.next(new AuthUser(user.mail, user.givenName, user.id, user.surname, user.displayName, user.email, {}, []))
                    this.router.navigate(['/complete-profile']);
                }
            }),
            catchError((err) => of(false)),
        );
    }

    public getUsersByType(...userTypes: UserType[]): Observable<User[]> {
        return this.users$.pipe(
            map((users) => {
                return users.filter((user) => userTypes.includes(user.userType))
            }),
        );
    }

    public changeUserStatus$(requestData: ChangeStatusRequestData[]): Observable<null> {
        this.loaderSvc.activate();
        return this.http.put<BaseResponse<any>>(`${this.userUrl}/updateuserstatus`, requestData).pipe(
            map((res) => res?.data),
            tap(() => {
                this.refreshUsers$$.next();
                this.loaderSvc.deactivate();
            }),
        );
    }

    public deleteUser(userID: number): Observable<any> {
        this.loaderSvc.activate();
        return this.http.delete<BaseResponse<Boolean>>(`${this.userUrl}/${userID}`).pipe(
            map((res) => res?.data),
            tap(() => {
                this.refreshUsers$$.next();
                this.loaderSvc.deactivate();
            }),
        );
    }

    public upsertUser$(requestData: AddStaffRequestData): Observable<User> {
        this.loaderSvc.activate();

        const {id, ...restData} = requestData;

        let url = this.userUrl;
        if (id) {
            url += `?userId=${id}`;
        }

        return this.http.post<BaseResponse<User>>(url, restData).pipe(
            map((res) => res?.data),
            tap(() => {
                this.refreshUsers$$.next();
                this.loaderSvc.deactivate();
            }),
        );
    }

    public userByID$(userID: number): Observable<User | undefined> {
        this.loaderSvc.activate();
        this.loaderSvc.spinnerActivate();

        return combineLatest([this.refreshUsers$$.pipe(startWith(''))]).pipe(
            switchMap(() =>
                this.http.get<BaseResponse<User>>(`${this.userUrl}/${userID}`).pipe(
                    map((res) => res?.data),
                    tap(() => {
                        this.loaderSvc.deactivate();
                        this.loaderSvc.spinnerDeactivate();
                    }),
                    catchError((e) => of({} as User)),
                ),
            ),
        );
    }
}
