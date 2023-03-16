import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { User, UserType } from '../../shared/models/user.model';
import { AddStaffRequestData, StaffType } from '../../shared/models/staff.model';
import { ChangeStatusRequestData } from '../../shared/models/status.model';

@Injectable({
  providedIn: 'root',
})
export class StaffApiService {
  private readonly userUrl = `${environment.serverBaseUrl}/user`;

  private refreshStaffs$$ = new Subject<void>();

  private readonly staffTypes$$ = new BehaviorSubject<StaffType[]>([
    StaffType.Radiologist,
    StaffType.Nursing,
    StaffType.Assistant,
    StaffType.Secretary,
  ]);

  constructor(private http: HttpClient) {}

  public get staffList$(): Observable<User[]> {
    return this.users$.pipe(map((users) => users.filter((user) => ![UserType.Scheduler, UserType.General].includes(user.userType))));
  }

  public get userLists$(): Observable<User[]> {
    return this.users$.pipe(
      map((users) => users.filter((user) => [UserType.Scheduler, UserType.General, UserType.Secretary].includes(user.userType))),
    );
  }

  private get users$(): Observable<User[]> {
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(
      switchMap(() => {
        return this.http.get<BaseResponse<User[]>>(this.userUrl).pipe(map((response) => response.data));
      }),
    );
  }

  public get allUsers$(): Observable<User[]> {
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(
      switchMap(() => this.fetchAllUsers$)
    )
  }
  private get fetchAllUsers$(): Observable<User[]> {
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(
      switchMap(() => {
        return this.http.get<BaseResponse<User[]>>(`${environment.serverBaseUrl}/common/getusers`).pipe(map((response) => response.data?.map((u) => ({...u, fullName: `${u.firstname} ${u.lastname}`}))));
      }),
    );
  }

  public addNewStaff$(requestData: AddStaffRequestData): Observable<User> {
    const { id, ...restData } = requestData;
    return this.http.post<BaseResponse<User>>(`${this.userUrl}?userId=${id}`, restData).pipe(
      map((response) => response.data),
      tap(() => this.refreshStaffs$$.next()),
    );
  }

  public updateStaff(requestData: AddStaffRequestData): Observable<User> {
    const { id, ...restData } = requestData;
    return this.http.put<BaseResponse<User>>(`${this.userUrl}/${id}`, restData).pipe(
      map((response) => response.data),
      tap(() => this.refreshStaffs$$.next()),
    );
  }

  public deleteStaff(staffID: number) {
    return this.http.delete<BaseResponse<Boolean>>(`${this.userUrl}/${staffID}`).pipe(
      map((response) => response),
      tap(() => this.refreshStaffs$$.next()),
    );
  }

  public getStaffByID(staffId: number): Observable<User | undefined> {
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(
      switchMap(() =>
        this.http.get<BaseResponse<User>>(`${this.userUrl}/${staffId}`).pipe(
          map((response) => response.data),
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

  public get staffTypes$(): Observable<StaffType[]> {
    return this.staffTypes$$.asObservable();
  }

  public changeUserStatus$(requestData: ChangeStatusRequestData[]): Observable<null> {
    return this.http.put<BaseResponse<any>>(`${this.userUrl}/updateuserstatus`, requestData).pipe(
      map((resp) => resp?.data),
      tap(() => this.refreshStaffs$$.next()),
    );
  }
}