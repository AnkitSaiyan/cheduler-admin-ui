import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserRoleEnum } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private permissionType$$: BehaviorSubject<UserRoleEnum>;

  constructor() {
    this.permissionType$$ = new BehaviorSubject<UserRoleEnum>(UserRoleEnum.Admin);
  }

  public get permissionType() {
    return this.permissionType$$.value;
  }

  public set permissionType(value: UserRoleEnum) {
    this.permissionType$$.next(value);
  }

  public get isNotReader() {
    return this.permissionType$$.value !== UserRoleEnum.Reader;
  }
}








