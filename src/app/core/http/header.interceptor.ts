import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from "../../../environments/environment";
import {UserService} from "../services/user.service";
import {GeneralUtils} from "../../shared/utils/general.utils";

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
    constructor(private userSvc: UserService) {
    }

    public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const SubDomain: string = window.location.host.split('.')[0];
        const usersUrl = environment.userManagementApiUrl + '/users';

        let currentTenantId = GeneralUtils.TenantID;
        const tenantIds = this.userSvc.getCurrentUser()?.tenantIds ?? [];
        if (!tenantIds.find((tenantId) => currentTenantId)) {
            currentTenantId = this.userSvc.getCurrentUser()?.tenantIds[0] as string;
        }

        const newRequest = request.clone({
            setHeaders: {
                SubDomain,
                ...(usersUrl === request.url ? {
                    'Context-Tenant-Id': currentTenantId
                } : {})
            },
        });

        return next.handle(newRequest);
    }
}
