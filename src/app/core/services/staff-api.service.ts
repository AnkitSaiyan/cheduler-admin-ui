import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, combineLatest, filter, map, Observable, of, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { User, UserType } from '../../shared/models/user.model';
import { AddStaffRequestData, StaffType } from '../../shared/models/staff.model';
import { ChangeStatusRequestData } from '../../shared/models/status.model';
import { ShareDataService } from './share-data.service';
import { DestroyableComponent } from '../../shared/components/destroyable.component';
import { Translate } from '../../shared/models/translate.model';
import { NameValue } from '../../shared/components/search-modal.component';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root',
})
export class StaffApiService extends DestroyableComponent implements OnDestroy {
  private readonly userUrl = `${environment.schedulerApiUrl}/user`;

  private refreshStaffs$$ = new Subject<void>();

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

  private selectedLang$$ = new BehaviorSubject<string>('');

  constructor(private http: HttpClient, private shareDataSvc: ShareDataService, private loaderSvc: LoaderService) {
    super();

    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => {
        this.selectedLang$$.next(lang);
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public get staffList$(): Observable<User[]> {
    this.loaderSvc.activate();
    this.loaderSvc.spinnerActivate();

    return this.users$.pipe(
      map((users) => users.filter((user) => ![UserType.Scheduler, UserType.General].includes(user.userType))),
      tap(() => {
        this.loaderSvc.deactivate();
        this.loaderSvc.spinnerDeactivate();
      }),
    );
  }

  public get userLists$(): Observable<User[]> {
    this.loaderSvc.activate();
    return this.users$.pipe(
      map((users) => users.filter((user) => [UserType.Scheduler, UserType.General, UserType.Secretary].includes(user.userType))),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  private get users$(): Observable<User[]> {
    this.loaderSvc.activate();
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(
      switchMap(() => {
        return this.http.get<BaseResponse<User[]>>(this.userUrl).pipe(
          map((response) => {
            return response.data?.map((user) => ({ ...user, fullName: `${user.firstname} ${user.lastname}` }));
          }),
          tap(() => this.loaderSvc.deactivate()),
        );
      }),
    );
  }

  public get allUsers$(): Observable<User[]> {
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllUsers$));
  }

  private get fetchAllUsers$(): Observable<User[]> {
    this.loaderSvc.activate();
    this.loaderSvc.spinnerActivate();

    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(
      switchMap(() => {
        return this.http.get<BaseResponse<User[]>>(`${environment.schedulerApiUrl}/common/getusers`).pipe(
          map((response) => response.data?.map((u) => ({ ...u, fullName: `${u.firstname} ${u.lastname}` }))),
          tap(() => {
            this.loaderSvc.deactivate();
            this.loaderSvc.spinnerDeactivate();
          }),
        );
      }),
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
      map((response) => response.data),
      tap(() => {
        this.refreshStaffs$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public updateStaff(requestData: AddStaffRequestData): Observable<User> {
    this.loaderSvc.activate();
    const { id, ...restData } = requestData;
    return this.http.put<BaseResponse<User>>(`${this.userUrl}/${id}`, restData).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshStaffs$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public deleteStaff(staffID: number) {
    this.loaderSvc.activate();
    return this.http.delete<BaseResponse<Boolean>>(`${this.userUrl}/${staffID}`).pipe(
      map((response) => response),
      tap(() => {
        this.refreshStaffs$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public getStaffByID(staffId: number): Observable<User | undefined> {
    this.loaderSvc.activate();
    this.loaderSvc.spinnerActivate();
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(
      switchMap(() =>
        this.http.get<BaseResponse<User>>(`${this.userUrl}/${staffId}`).pipe(
          map((response) => response.data),
          tap(() => {
            this.loaderSvc.deactivate();
            this.loaderSvc.spinnerDeactivate();
          }),
          catchError((e) => {
            return of({} as User);
          }),
        ),
      ),
    );
  }

  public getUsersByType(userType: UserType): Observable<User[]> {
    return this.allUsers$.pipe(
      map((staffs) =>
        staffs.filter((staff) => {
          return staff.userType === userType;
        }),
      ),
    );
  }

  public get radiologists$(): Observable<User[]> {
    return this.staffList$.pipe(map((staffs) => staffs.filter((staff) => staff.userType === UserType.Radiologist)));
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

  public changeUserStatus$(requestData: ChangeStatusRequestData[]): Observable<null> {
    this.loaderSvc.activate();
    return this.http.put<BaseResponse<any>>(`${this.userUrl}/updateuserstatus`, requestData).pipe(
      map((resp) => resp?.data),
      tap(() => {
        this.refreshStaffs$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }
}
