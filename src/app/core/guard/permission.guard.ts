import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { RouteName, RouteType } from 'src/app/shared/models/permission.model';
import { UserRoleEnum } from 'src/app/shared/models/user.model';
import { PermissionService } from '../services/permission.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionGuard implements CanActivateChild {
  constructor(private permissionSvc: PermissionService, private router: Router) {}

  canActivateChild(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    switch (this.permissionSvc.permissionType$$.value) {
      case UserRoleEnum.Reader: {
        const isPermitted = this.isReaderPermitted(route);
        return isPermitted;
      }
      default:
        break;
    }
    return true;
  }

  private isReaderPermitted(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (
      route.data['routeType'] === RouteType.Add ||
      route.data['routeName'] === RouteName.Practice ||
      route.data['routeName'] === RouteName.SiteSetting
    )
      return this.router.parseUrl('/dashboard');
    return true;
  }

  private isGeneralUserPermitted(route: ActivatedRouteSnapshot): boolean {
    if (route.data['routeName'] === RouteName.Practice || route.data['routeName'] === RouteName.SiteSetting) return false;
    return true;
  }
}



























