import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { filter } from 'rxjs';
import { PermissionService } from 'src/app/core/services/permission.service';
import { UserRoleEnum } from 'src/app/shared/models/user.model';

@Component({
  selector: 'dfm-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  public userRole: { name: any; value: any }[] = [
    {
      name: UserRoleEnum.Admin,
      value: UserRoleEnum.Admin,
    },
    {
      name: UserRoleEnum.GeneralUser,
      value: UserRoleEnum.GeneralUser,
    },
    {
      name: UserRoleEnum.Reader,
      value: UserRoleEnum.Reader,
    },
  ];

  public userRoleControl = new FormControl(UserRoleEnum.Admin, []);

  constructor(private permissionSvc: PermissionService) {}

  ngOnInit(): void {
    this.userRoleControl.valueChanges.pipe(filter(Boolean)).subscribe((value) => {
      localStorage.setItem('userRole', value);
      this.permissionSvc.setPermissionType(value);
    });
  }

  public handleClick() {
    document.querySelector('#top')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}
