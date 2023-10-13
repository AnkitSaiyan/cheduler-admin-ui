import { Inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, filter, map, Observable, of, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { User, UserRoleEnum } from '../../shared/models/user.model';
import { NameValue } from '../../shared/components/search-modal.component';
import { PermissionService } from './permission.service';
import { environment } from '../../../environments/environment';
import { LoaderService } from './loader.service';
import { BaseResponse } from '../../shared/models/base-response.model';
import { ChangeStatusRequestData } from '../../shared/models/status.model';
import { AddStaffRequestData, StaffType } from '../../shared/models/staff.model';
import { Translate } from '../../shared/models/translate.model';
import { ShareDataService } from './share-data.service';
import { DestroyableComponent } from '../../shared/components/destroyable.component';
import { Router } from '@angular/router';
import { HttpUtils } from '../../shared/utils/http.utils';

@Injectable({
	providedIn: 'root',
})
export class UserApiService extends DestroyableComponent implements OnDestroy {
	private readonly userUrl = `${environment.schedulerApiUrl}/user`;

	private selectedLang$$: BehaviorSubject<string> = new BehaviorSubject<string>('');

	private pageNoUser$$ = new BehaviorSubject<number>(1);

	private pageNoStaff$$ = new BehaviorSubject<number>(1);

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

	public set pageNoStaff(pageNo: number) {
		this.pageNoStaff$$.next(pageNo);
	}

	public get pageNoStaff(): number {
		return this.pageNoStaff$$.value;
	}

	public set pageNoUser(pageNo: number) {
		this.pageNoUser$$.next(pageNo);
	}

	public get pageNoUser(): number {
		return this.pageNoUser$$.value;
	}

	public get staffs$(): Observable<BaseResponse<User[]>> {
		return combineLatest([this.pageNoStaff$$]).pipe(switchMap(([pageNo]) => this.fetchStaffs$(pageNo)));
	}

	public get allStaffs$(): Observable<User[]> {
		this.loaderSvc.activate();

		return this.http.get<BaseResponse<User[]>>(`${environment.schedulerApiUrl}/common/getstaff`).pipe(
			map((res) => res?.data?.map((u) => ({ ...u, fullName: `${u.firstname} ${u.lastname}` }))),
			tap(() => {
				this.loaderSvc.deactivate();
				this.loaderSvc.spinnerDeactivate();
			}),
		);
	}

	public getUserByID$(userID: number): Observable<User | undefined> {
		this.loaderSvc.activate();
		this.loaderSvc.spinnerActivate();

		return this.http.get<BaseResponse<User>>(`${this.userUrl}/${userID}`).pipe(
			map((res) => res?.data),
			tap(() => {
				this.loaderSvc.deactivate();
				this.loaderSvc.spinnerDeactivate();
			}),
			catchError((e) => of({} as User)),
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
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	public deleteUser(userID: number): Observable<any> {
		this.loaderSvc.activate();
		return this.http.delete<BaseResponse<Boolean>>(`${this.userUrl}/${userID}`).pipe(
			map((res) => res?.data),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	public changeUserStatus$(requestData: ChangeStatusRequestData[]): Observable<null> {
		this.loaderSvc.activate();
		return this.http.put<BaseResponse<any>>(`${this.userUrl}/updateuserstatus`, requestData).pipe(
			map((res) => res?.data),
			tap(() => this.loaderSvc.deactivate()),
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

	private fetchUsers$(pageNo: number): Observable<BaseResponse<User[]>> {
		this.loaderSvc.activate();

		const params = new HttpParams().append('pageNo', pageNo);

		return this.http.get<BaseResponse<User[]>>(this.userUrl, { params }).pipe(
			map((res) => {
				return {
					...res,
					data: res?.data?.map((user) => ({
						...user,
						fullName: `${user.firstname} ${user.lastname}`,
					})),
				};
			}),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	private fetchStaffs$(pageNo: number): Observable<BaseResponse<User[]>> {
		this.loaderSvc.activate();

		const params = new HttpParams().append('pageNo', pageNo);

		return this.http.get<BaseResponse<User[]>>(`${this.userUrl}/getstaff`, { params }).pipe(
			map((res) => {
				return {
					...res,
					data: res?.data?.map((user) => ({
						...user,
						fullName: `${user.firstname} ${user.lastname}`,
					})),
				};
			}),
			tap(() => this.loaderSvc.deactivate()),
		);
	}
}
