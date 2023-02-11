import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { User, UserType } from '../../shared/models/user.model';
import { AddStaffRequestData, StaffType } from '../../shared/models/staff.model';

@Injectable({
  providedIn: 'root',
})
export class StaffApiService {
  private refreshStaffs$$ = new Subject();

  private readonly staffTypes$$ = new BehaviorSubject<StaffType[]>([
    StaffType.Radiologist,
    StaffType.Nursing,
    StaffType.Assistant,
    StaffType.Secretary,
  ]);

  constructor(private http: HttpClient) {}

  public get staffList$(): Observable<User[]> {
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchStaffList()));
  }

  private fetchStaffList(): Observable<User[]> {
    return this.http.get<BaseResponse<User[]>>(`${environment.serverBaseUrl}/user?pageNo=1`).pipe(map((response) => response.data));
  }

  // public upsertStaff$(requestData: AddStaffRequestData): Observable<string> {
  //   if (!requestData) {
  //     return of('');
  //   }

  //   console.log(requestData);
  //   if (requestData.id) {
  //     const index = this.staffLists.findIndex((staff) => staff.id === requestData.id);
  //     if (index !== -1) {
  //       console.log(index);
  //       this.staffLists[index] = {
  //         ...this.staffLists[index],
  //         id: requestData.id,
  //         firstname: requestData.firstname,
  //         lastname: requestData.lastname,
  //         userType: requestData.userType,
  //         email: requestData.email,
  //         telephone: requestData.telephone,
  //         address: requestData?.address ?? this.staffLists[index].address,
  //         status: this.staffLists[index].status,
  //         availabilityType: this.staffLists[index].availabilityType,
  //         deletedBy: null,
  //         gsm: requestData.gsm ?? this.staffLists[index].gsm,
  //         examList: requestData?.examLists ?? this.staffLists[index].examList,
  //         practiceAvailability: requestData.practiceAvailability ?? (this.staffLists[index].practiceAvailability as PracticeAvailability[]),
  //         info: requestData?.info ?? this.staffLists[index].info,
  //       };

  //       console.log(requestData);
  //     }
  //   } else {
  //     this.staffLists.push({
  //       id: Math.random(),
  //       firstname: requestData.firstname,
  //       lastname: requestData.lastname,
  //       userType: requestData.userType,
  //       email: requestData.email,
  //       telephone: requestData.telephone,
  //       address: requestData?.address ?? '',
  //       status: Status.Active,
  //       availabilityType: AvailabilityType.Available,
  //       deletedBy: null,
  //       gsm: requestData.gsm ?? '',
  //       examList: requestData?.examLists ?? [],
  //       practiceAvailability: requestData.practiceAvailability ?? ([] as PracticeAvailability[]),
  //       info: requestData?.info ?? '',
  //     });
  //   }

  //   this.refreshStaffs$$.next('');

  //   return of('created');
  // }

  // TODO: CHANGE STAFF LIST HAVE TO IMPLEMENT

  // public changeStaffStatus$(changes: { id: number | string; newStatus: Status | null }[]): Observable<boolean> {
  //   if (!changes.length) {
  //     return of(false);
  //   }

  //   let changed = false;
  //   changes.forEach((change) => {
  //     const index = this.staffLists.findIndex((staff) => staff.id === +change.id);
  //     if (index !== -1 && change.newStatus !== null) {
  //       this.staffLists[index] = {
  //         ...this.staffLists[index],
  //         status: change.newStatus,
  //       };

  //       if (!changed) {
  //         changed = true;
  //       }
  //     }
  //   });

  //   this.refreshStaffs$$.next('');

  //   return of(true);
  // }

  public addNewStaff$(requestData: AddStaffRequestData): Observable<any> {
    console.log('requestData add: ', requestData);
    const { id, ...restData } = requestData;
    return this.http.post<BaseResponse<AddStaffRequestData>>(`${environment.serverBaseUrl}/user`, restData).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshStaffs$$.next('');
      }),
    );
  }

  public updateStaff(requestData: AddStaffRequestData): Observable<any> {
    console.log('requestData for update: ', requestData);
    const { id, ...restData } = requestData;
    return this.http.put<BaseResponse<AddStaffRequestData>>(`${environment.serverBaseUrl}/user/${id}`, restData).pipe(
      map((response) => response.data),
      tap(() => this.refreshStaffs$$.next('')),
    );
  }

  public deleteStaff(staffID: number) {
    return this.http.delete<BaseResponse<Boolean>>(`${environment.serverBaseUrl}/user/${staffID}`).pipe(
      map((response) => response),
      tap(() => {
        this.refreshStaffs$$.next('');
      }),
    );
  }

  public getStaffByID(staffId: number): Observable<User | undefined> {
    console.log('staffID: ', staffId);
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(
      switchMap(() =>
        this.http.get<BaseResponse<User>>(`${environment.serverBaseUrl}/user/${staffId}`).pipe(
          map((response) => response.data),
          catchError((e) => {
            console.log('error', e);
            return of({} as User);
          }),
        ),
      ),
    );
  }

  public getUsersByType(userType: UserType): Observable<User[]> {
    return this.fetchStaffList().pipe(
      map((staffs) =>
        staffs.filter((staff) => {
          console.log('staff: ', staff);
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
}
