import {Inject, Injectable, OnDestroy} from '@angular/core';
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
import {MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalService} from '@azure/msal-angular';
import {User, UserRoleEnum, UserType} from '../../shared/models/user.model';
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
import {HttpUtils} from "../../shared/utils/http.utils";

@Injectable({
	providedIn: 'root',
})
export class UserApiService extends DestroyableComponent implements OnDestroy {
	private readonly userUrl = `${environment.schedulerApiUrl}/user`;

	private selectedLang$$: BehaviorSubject<string> = new BehaviorSubject<string>('');
	private refreshUsers$$: Subject<void> = new Subject<void>();

	private readonly userRoles$$ = new BehaviorSubject<NameValue[]>([
		{
			name: 'Admin',
			value: UserRoleEnum.Admin,
		},
		{
			name: 'General User',
			value: UserRoleEnum.GeneralUser,
		},
		{
			name: 'Reader',
			value: UserRoleEnum.Reader,
		},
	]);

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

	public userIdToRoleMap = new Map<string, UserRoleEnum>();

	constructor(
		private http: HttpClient,
		private msalService: MsalService,
		private permissionSvc: PermissionService,
		private loaderSvc: LoaderService,
		private shareDataSvc: ShareDataService,
		private router: Router,
		@Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
	) {
		super();

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => this.selectedLang$$.next(lang),
			});
	}

	public get generalUsers$(): Observable<User[]> {
		return this.getUsersByType(UserType.General);
	}

	public get allGeneralUsers$(): Observable<User[]> {
		return this.fetchAllUsers$.pipe(
			map((users) => {
				return users.filter((user) => user.userType === UserType.General);
			}),
		);
	}

	public get staffs$(): Observable<User[]> {
		return this.getUsersByType(UserType.Assistant, UserType.Radiologist, UserType.Secretary, UserType.Nursing);
	}

	public get allStaffs$(): Observable<User[]> {
		return this.fetchAllUsers$.pipe(
			map((users) => {
				return users.filter((user) => [UserType.Nursing, UserType.Assistant, UserType.Radiologist, UserType.Secretary].includes(user.userType));
			}),
		);
	}

	public getUsersByType(...userTypes: UserType[]): Observable<User[]> {
		return this.users$.pipe(
			map((users) => {
				return users.filter((user) => userTypes.includes(user.userType));
			}),
		);
	}

	public getUserByID$(userID: number): Observable<User | undefined> {
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

	public upsertUser$(requestData: AddStaffRequestData): Observable<User> {
		this.loaderSvc.activate();

		const { id, ...restData } = requestData;

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

	public get roleTypes$(): Observable<NameValue[]> {
		return combineLatest([this.selectedLang$$.pipe(startWith(''))]).pipe(
			switchMap(([lang]) =>
				this.userRoles$$.asObservable().pipe(
					filter(() => !!lang),
					map((roleTypes) =>
						roleTypes.map((roleType) => ({
							...roleType,
							name: roleType.name === 'Admin' ? 'Admin' : Translate[roleType.name][lang],
						})),
					),
				),
			),
		);
	}

	public getUserRole(userId: string): Observable<UserRoleEnum> {
		if (this.userIdToRoleMap.has(userId)) {
			return of(this.userIdToRoleMap.get(userId) as UserRoleEnum);
		}

		return this.http.get<UserRoleEnum[]>(`${environment.schedulerApiUrl}/userroles?userId=${userId}`).pipe(
			map((roles) => {
				return roles[0] ?? '';
			}),
			tap((role) => this.userIdToRoleMap.set(userId, role as UserRoleEnum)),
		);
	}

	public assignUserRole(userId: string, roleName: string): Observable<any> {
		const headers = HttpUtils.GetHeader(['Content-Type', 'Application/json']);
		return this.http.post<any>(`${environment.schedulerApiUrl}/userroles?userId=${userId}`, JSON.stringify(roleName), { headers });
	}

	private get fetchAllUsers$(): Observable<User[]> {
		this.loaderSvc.activate();
		this.loaderSvc.spinnerActivate();

		return combineLatest([this.refreshUsers$$.pipe(startWith(''))]).pipe(
			switchMap(() => {
				return this.http.get<BaseResponse<User[]>>(`${environment.schedulerApiUrl}/common/getusers`).pipe(
					map((res) => res?.data?.map((u) => ({ ...u, fullName: `${u.firstname} ${u.lastname}` }))),
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
							fullName: `${user.firstname} ${user.lastname}`,
						}));
					}),
					tap(() => this.loaderSvc.deactivate()),
					catchError(() => of([])),
				);
			}),
		);
	}
}
