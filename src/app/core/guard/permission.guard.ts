import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateChild, Router, UrlTree} from '@angular/router';
import {map, Observable} from 'rxjs';
import {RouteName, RouteType} from 'src/app/shared/models/permission.model';
import {UserRoleEnum} from 'src/app/shared/models/user.model';
import {PermissionService} from '../services/permission.service';
import {NotificationDataService} from "../services/notification-data.service";
import {Translate} from "../../shared/models/translate.model";
import {ENG_BE} from "../../shared/utils/const";

@Injectable({
	providedIn: 'root',
})
export class PermissionGuard implements CanActivateChild {
	constructor(private permissionSvc: PermissionService, private router: Router, private notificationSvc: NotificationDataService) {}

	canActivateChild(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		return this.permissionSvc.permissionType$.pipe(
			map((permissionType) => {
				switch (permissionType) {
					case UserRoleEnum.Reader:
						return this.isReaderPermitted(route);
					case UserRoleEnum.GeneralUser:
						return this.isReaderPermitted(route);
					default:
						/*  General user can not perform delete actions,
                            since there is not page for delete we dont need to check for general users
                         */
						return true;
				}
			}),
		);
	}

	private isReaderPermitted(route: ActivatedRouteSnapshot): boolean | UrlTree {
		if (
			route.data['routeType'] === RouteType.Add ||
			route.data['routeName'] === RouteName.Practice ||
			route.data['routeName'] === RouteName.SiteSetting ||
			route.data['routeName'] === RouteName.EmailTemplate
		) {
			this.notificationSvc.showError(Translate.Error.Unauthorized[ENG_BE]);
			return this.router.parseUrl('/dashboard');
		}
		return true;
	}

	private isGeneralUserPermitted(route: ActivatedRouteSnapshot): boolean | UrlTree {
		if (
			route.data['routeName'] === RouteName.Practice ||
			route.data['routeName'] === RouteName.SiteSetting ||
			route.data['routeName'] === RouteName.EmailTemplate
		) {
			this.notificationSvc.showError(Translate.Error.Unauthorized[ENG_BE]);
			return this.router.parseUrl('/dashboard');
		}
		return true;
	}
}


































