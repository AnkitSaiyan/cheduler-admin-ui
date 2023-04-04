import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserRoleEnum } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  public permissionType$$: BehaviorSubject<UserRoleEnum>;

  constructor() {
    this.permissionType$$ = new BehaviorSubject<UserRoleEnum>(UserRoleEnum.Reader);
  }
}

