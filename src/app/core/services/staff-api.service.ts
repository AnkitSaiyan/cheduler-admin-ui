import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';
import { AvailabilityType, User, UserType } from '../../shared/models/user.model';
import { Status } from '../../shared/models/status';
import { AddStaffRequestData } from '../../shared/models/staff.model';
import { Weekday } from '../../shared/models/calendar.model';
import { PracticeAvailability } from '../../shared/models/practice.model';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StaffApiService {
  private staffLists: User[] = [
    {
      id: 1,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.Radiologist,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Unavailable,
      deletedBy: null,
      gsm: '',
      examList: [1, 2, 3, 5, 6, 7, 8],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 2,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [1],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.MON,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 3,
      firstname: 'David',
      lastname: 'Warner',
      userType: UserType.General,
      email: 'david@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Unavailable,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 4,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.SAT,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 5,
      firstname: 'Jennifer',
      lastname: 'Woodley',
      userType: UserType.Assistant,
      email: 'jennifer@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Unavailable,
      deletedBy: null,
      gsm: '',
      examList: [1, 2],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.THU,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 6,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.Nursing,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.SUN,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 7,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.Scheduler,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Unavailable,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 8,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 9,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.Assistant,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Unavailable,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [],
    },
    {
      id: 10,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.Radiologist,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 11,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.WED,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 12,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 13,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.Radiologist,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: Weekday.THU,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
  ];

  private refreshStaffs$$ = new Subject();

  constructor(private http: HttpClient) {}

  public get staffList$(): Observable<User[]> {
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchStaffList()));
  }

  private fetchStaffList(): Observable<User[]> {
    return this.http
      .get<BaseResponse<User[]>>(`${environment.serverBaseUrl}/user?pageNo=1`)
      .pipe(map((response) => response.data));
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



  //TODO: CHANGE STAFF LIST HAVE TO IMPLEMENT

  public changeStaffStatus$(changes: { id: number | string; newStatus: Status | null }[]): Observable<boolean> {
    if (!changes.length) {
      return of(false);
    }

    let changed = false;
    changes.forEach((change) => {
      const index = this.staffLists.findIndex((staff) => staff.id === +change.id);
      if (index !== -1 && change.newStatus !== null) {
        this.staffLists[index] = {
          ...this.staffLists[index],
          status: change.newStatus,
        };

        if (!changed) {
          changed = true;
        }
      }
    });

    this.refreshStaffs$$.next('');

    return of(true);
  }

  public addNewStaff$(requestData: AddStaffRequestData): Observable<any>{
    console.log('requestData add: ', requestData);
    const { id, ...restData} = requestData;
    return this.http.post<BaseResponse<AddStaffRequestData>>(`${environment.serverBaseUrl}/user`, restData).pipe(
      map(response => response.data)
    )
  }

  public updateStaff(requestData: AddStaffRequestData): Observable<any>{
    console.log('requestData for update: ', requestData);
    const { id, ...restData} = requestData;
    return this.http.post<BaseResponse<AddStaffRequestData>>(`${environment.serverBaseUrl}/user/${id}`, restData).pipe(
      map(response => response.data)
    )
  }

  public deleteStaff(staffID: number) {
    return this.http
      .delete<BaseResponse<Boolean>>(`${environment.serverBaseUrl}/user/${staffID}`)
      .pipe(map((response) => response));
  }


  public getStaffByID(staffId: number): Observable<User | undefined> {
    console.log('staffID: ', staffId);
    let queryParams = new HttpParams();
    queryParams = queryParams.append('id', staffId);
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(
      switchMap(() =>
        this.http.get<BaseResponse<User>>(`${environment.serverBaseUrl}/user`, {params: queryParams})
        .pipe(
          map((response) => response.data), 
          catchError((e) =>{
            console.log("error", e)
            return of({} as User)
        })
        )))
  }

  public getUsersByType(userType: UserType): Observable<User[]> {
    return this.fetchStaffList().pipe(map((staffs) => staffs.filter((staff) => staff.userType === userType)));
  }
}
