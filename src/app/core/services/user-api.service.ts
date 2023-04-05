import {Injectable} from '@angular/core';
import {BehaviorSubject, map, Observable, of, Subject, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {MsalService} from '@azure/msal-angular';
import {AuthUser, UserRoleEnum} from '../../shared/models/user.model';
import {UserManagementApiService} from './user-management-api.service';
import {NameValue} from "../../shared/components/search-modal.component";
import {PermissionService} from "./permission.service";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private authUser$$: BehaviorSubject<AuthUser | undefined> = new BehaviorSubject<AuthUser | undefined>(undefined);

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
  ]

  constructor(
    private http: HttpClient,
    private msalService: MsalService,
    private UserManagementApiService: UserManagementApiService,
    private permissionSvc: PermissionService
  ) {
  }

  public get authUser$(): Observable<AuthUser | undefined> {
    return this.authUser$$.asObservable();
  }

  public removeUser() {
    this.authUser$$.next(undefined);
    this.permissionSvc.removePermissionType();
  }

  public getUserRoles(): NameValue[] {
    return [...this.userRoles];
  }

  public getCurrentUserRole$(userId: string): Observable<any> {
    // Api to be integrated
    this.http.get(`${environment.schedulerApiUrl}/users/${userId}/roles`).subscribe({
      next: (roles) => {
        console.log(roles);
      }
    });
    return of(UserRoleEnum.Admin);
  }

  public initializeUser(): Observable<boolean> {
    const user = this.msalService.instance.getActiveAccount();
    const userId = user?.localAccountId ?? '';

    return this.UserManagementApiService.getUserProperties(userId).pipe(
      map((res: any) => {
        try {
          const tenants = ((user?.idTokenClaims as any).extension_Tenants as string).split(',');
          if (tenants.length === 0) {
            return false;
          }
          this.authUser$$.next(new AuthUser(res.email, res.givenName, res.id, res.surname, res.displayName, res.email, res.properties, tenants));
          return true;
        } catch (error) {
          return false;
        }
      }),

      // get user role
      map((res) => {
        if (res) {
          this.getCurrentUserRole$(userId).pipe(
            map((role) => (this.permissionSvc.setPermissionType(role as UserRoleEnum))),
          )
          return true;
        }
        return false;
      })
    );
  }
}
