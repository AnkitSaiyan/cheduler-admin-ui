import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { AvailabilityType, User, UserType } from '../../shared/models/user.model';
import { Status } from '../../shared/models/status';
import { Weekday } from '../../shared/models/calendar.model';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private generalUsers: any[] = [
    {
      name: 'Assistant',
      value: UserType.Assistant,
    },
    {
      name: 'Radiologist',
      value: UserType.Radiologist,
    },
    {
      name: 'Nursing',
      value: UserType.Nursing,
    },
    {
      name: 'Secretary',
      value: UserType.Secretary,
    },
  ];

  private refreshGeneralUsers$$ = new Subject<void>();


  // private users: User[] = [
  //   {
  //     id: 1,
  //     firstname: 'Maaike',
  //     lastname: 'Benooit',
  //     userType: UserType.Radiologist,
  //     email: 'maaike@deflexmo.be',
  //     telephone: '9812345678',
  //     address: '',
  //     status: Status.Inactive,
  //     availabilityType: AvailabilityType.Unavailable,
  //     deletedBy: null,
  //     gsm: '',
  //     examList: [1, 2, 3, 5, 6, 7, 8],
  //     practiceAvailability: [
  //       {
  //         id: 60,
  //         weekday: Weekday.FRI,
  //         dayStart: new Date(),
  //         dayEnd: new Date(),
  //       },
  //       {
  //         id: 60,
  //         weekday: Weekday.FRI,
  //         dayStart: new Date(),
  //         dayEnd: new Date(),
  //       },
  //     ],
  //   },
  // ];

  constructor(private http: HttpClient) {}

  
  public get generalUserTypes$(): Observable<User[]> {
    return combineLatest([this.refreshGeneralUsers$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchGeneralUserTypes()));
  }

  private fetchGeneralUserTypes(): Observable<User[]> {
    return this.http
      .get<BaseResponse<User[]>>(`${environment.serverBaseUrl}/user`)
      .pipe(map((response) => response.data));
  }


  deleteStaff(id: number): Observable<User>{
    return this.http.delete<BaseResponse<User>>(`${environment.serverBaseUrl}/user/${id}`).pipe(
      map(response => response.data),
      tap(()=>{this.refreshGeneralUsers$$.next()})
    )
  }
}
