import {Injectable} from "@angular/core";
import {
    ActivatedRouteSnapshot,
    CanActivate,
    CanActivateChild,
    Router,
    RouterStateSnapshot,
    UrlTree
} from "@angular/router";
import {debounceTime, filter, map, Observable} from "rxjs";
import {RouteName} from "../../shared/models/permission.model";
import {AuthUser} from "../../shared/models/user.model";
import {UserService} from "../services/user.service";

@Injectable({
    providedIn: 'root'
})
export class RouteGuard implements CanActivate, CanActivateChild {
    constructor(private userService: UserService, private router: Router) {
    }

    public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        const {url} = state;
        return this.isProfileIncomplete(url);
    }

    public canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        const {url} = state;
        return this.isProfileIncomplete(url);
    }

    private isProfileIncomplete(url: string) {
        return this.userService.authUser$.pipe(
            filter((user) => !!user),
            debounceTime(0),
            map((user) => {
                try {
                    const isIncomplete = !!user?.properties['extension_ProfileIsIncomplete'];
                    const splitUrl = url.split('/')[1];

                    switch (splitUrl) {
                        case RouteName.LoginFailed: {
                            if (AuthUser) {
                                return this.router.parseUrl('/');
                            }
                            break;
                        }
                        case RouteName.CompleteProfile: {
                            if (!isIncomplete) {
                                return this.router.parseUrl(`/`);
                            }
                            break;
                        }
                        default: {
                            if (isIncomplete) {
                                return this.router.parseUrl(`/${RouteName.CompleteProfile}`);
                            }
                        }
                    }

                    return true;
                } catch (e) {
                    return false;
                }
            })
        )
    }
}