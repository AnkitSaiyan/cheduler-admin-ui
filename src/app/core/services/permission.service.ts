import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import { UserRoleEnum } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private permissionType$$: BehaviorSubject<UserRoleEnum>;

  constructor() {
    const userRole = localStorage.getItem('userRole');
    this.permissionType$$ = new BehaviorSubject<UserRoleEnum>((userRole as UserRoleEnum) ?? UserRoleEnum.Admin);
  }

  public get permissionType$(): Observable<UserRoleEnum> {
    return this.permissionType$$.asObservable() as Observable<UserRoleEnum>;
  }

  public setPermissionType(value: UserRoleEnum) {
    this.permissionType$$.next(value);
    localStorage.setItem('userRole', value);
  }

  public get isNotReader() {
    return this.permissionType$$.value !== UserRoleEnum.Reader;
  }
}











