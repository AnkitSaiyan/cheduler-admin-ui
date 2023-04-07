import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from "@angular/router";
import {map, Observable} from "rxjs";
import {UserApiService} from "../services/user-api.service";

@Injectable({
    providedIn: 'root'
})
export class ProfileCompleteGuard implements CanActivate {
    constructor(private userApiService: UserApiService, private router: Router) {
    }

    public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        return this.isProfileIncomplete();
    }

    private isProfileIncomplete() {
        return this.userApiService.authUser$.pipe(
            map((user) => {
                try {
                    const isIncomplete = !!user?.properties['extension_ProfileIsIncomplete'];

                    if (!isIncomplete) {
                        return this.router.parseUrl('/dashboard');
                    }

                    return true;
                } catch (e) {
                    console.log(e);
                    return false;
                }
            })
        )
    }
}