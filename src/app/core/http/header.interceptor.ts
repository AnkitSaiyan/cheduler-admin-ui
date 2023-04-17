import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from "../../../environments/environment";
import {UserService} from "../services/user.service";

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
    constructor(private userSvc: UserService) {
    }

    public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const SubDomain: string = window.location.host.split('.')[0];
        const usersUrl = environment.userManagementApiUrl + '/users';

        const newRequest = request.clone({
            setHeaders: {
                SubDomain,
                ...(usersUrl === request.url ? {
                    'Context-Tenant-Id': this.userSvc.getCurrentUser()?.tenantIds[0] as string
                } : {})
            },
        });

        return next.handle(newRequest);
    }
}
