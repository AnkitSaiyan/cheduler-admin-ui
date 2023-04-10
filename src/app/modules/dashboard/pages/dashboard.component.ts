import {Component, OnInit} from '@angular/core';
import {UserApiService} from "../../../core/services/user-api.service";
import {NameValue} from "../../../shared/components/search-modal.component";
import {FormControl} from "@angular/forms";
import {debounceTime, take} from "rxjs";
import {PermissionService} from "../../../core/services/permission.service";

@Component({
    selector: 'dfm-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
    public userRoleControl: FormControl = new FormControl('', []);
    public userRoles: NameValue[] = [];

    public constructor(
        private userApiSvc: UserApiService,
        private permissionSvc: PermissionService
    ) {
    }

    public ngOnInit() {
        this.userRoles = this.userApiSvc.getRoleTypes();

        this.userRoleControl.valueChanges.pipe(debounceTime(0)).subscribe((userRole) => {
            this.permissionSvc.setPermissionType(userRole);
        });

        this.permissionSvc.permissionType$.pipe(take(1)).subscribe((userRole) => {
            setTimeout(() => this.userRoleControl.setValue(userRole), 0);
        });
    }

    public handleClick() {
        document.querySelector('#top')?.scrollIntoView({block: 'start', behavior: 'smooth'});
    }
}
