import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { AvailabilityType, UserType } from '../../shared/models/user.model';
import { Status } from '../../shared/models/status.model';
import { Weekday } from '../../shared/models/calendar.model';
import { User } from '../../shared/models/login-user.model';
import { UserManagementApiService } from './user-management-api.service';

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  public user$: BehaviorSubject<User | undefined> = new BehaviorSubject<User | undefined>(undefined);

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

  // eslint-disable-next-line @typescript-eslint/no-shadow
  constructor(private http: HttpClient, private msalService: MsalService, private UserManagementApiService: UserManagementApiService) {}

  public get generalUserTypes$(): Observable<User[]> {
    return combineLatest([this.refreshGeneralUsers$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchGeneralUserTypes()));
  }

  private fetchGeneralUserTypes(): Observable<User[]> {
    return this.http.get<BaseResponse<User[]>>(`${environment.serverBaseUrl}/user`).pipe(map((response) => response.data));
  }

  deleteStaff(id: number): Observable<User> {
    return this.http.delete<BaseResponse<User>>(`${environment.serverBaseUrl}/user/${id}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshGeneralUsers$$.next();
      }),
    );
  }

  public intializeUser(): Observable<boolean> {
    const user = this.msalService.instance.getActiveAccount();
    const userId = user?.localAccountId ?? '';
    return this.UserManagementApiService.getUserProperties(userId).pipe(
      map((res) => {
        try {
          const tenants = ((user?.idTokenClaims as any).extension_Tenants as string).split(',');
          if (tenants.length === 0) {
            return false;
          }
          this.user$.next(new User(res.email, res.givenName, res.id, res.surname, res.displayName, res.email, res.properties, tenants));
          return true;
        } catch (error) {
          return false;
        }
      }),
    );
  }

  public getCurrentUser(): User {
    return this.user$.value as User;
  }

  public logout(): void {
    this.msalService.logout();
    this.user$.next(undefined);
  }
}
