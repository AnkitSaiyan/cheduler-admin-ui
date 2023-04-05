import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {filter, take, takeUntil} from 'rxjs';
import { PermissionService } from 'src/app/core/services/permission.service';
import { UserRoleEnum } from 'src/app/shared/models/user.model';
import {NameValue} from "../../../shared/components/search-modal.component";
import {UserApiService} from "../../../core/services/user-api.service";

@Component({
  selector: 'dfm-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  public userRoles: NameValue[] = [];

  public userRoleControl = new FormControl();

  constructor(private userSvc: UserApiService, private permissionSvc: PermissionService) {}

  ngOnInit(): void {
    this.userRoles = [...this.userSvc.getUserRoles()];

    this.permissionSvc.permissionType$.pipe(take(1)).subscribe((role) => {
      console.log('role', role);
      setTimeout(() => {
        this.userRoleControl.setValue(role);
      }, 0);
    });

    this.userRoleControl.valueChanges.pipe(filter(Boolean)).subscribe((value) => {
      this.permissionSvc.setPermissionType(value);
    });
  }

  public handleClick() {
    document.querySelector('#top')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}
