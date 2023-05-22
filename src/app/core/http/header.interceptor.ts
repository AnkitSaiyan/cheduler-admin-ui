import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { Translate } from 'src/app/shared/models/translate.model';
import { DUTCH_BE, ENG_BE } from 'src/app/shared/utils/const';
import { environment } from '../../../environments/environment';
import { GeneralUtils } from '../../shared/utils/general.utils';
import { NotificationDataService } from '../services/notification-data.service';
import { UserService } from '../services/user.service';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
	constructor(private userSvc: UserService, public notificationSvc: NotificationDataService) {}

	public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
		const SubDomain: string = window.location.host.split('.')[0];
		const usersUrl = environment.userManagementApiUrl + '/users';

		const sessionExp = localStorage.getItem('sessionExp');

		if (sessionExp && +sessionExp < new Date().getTime()) {
			const lang = localStorage.getItem('lang');
			this.notificationSvc.showError(Translate.sessionExp[lang!]);

			setTimeout(() => {
				this.userSvc.logout();
			}, 1500);

			return EMPTY;
		}

		GeneralUtils.saveSessionExpTime();

		// let currentTenantId = GeneralUtils.TenantID;
		// const tenantIds = this.userSvc.getCurrentUser()?.tenantIds ?? [];
		// if (!tenantIds.find((tenantId) => currentTenantId)) {
		//     currentTenantId = this.userSvc.getCurrentUser()?.tenantIds[0] as string;
		// }

		const newRequest = request.clone({
			setHeaders: {
				SubDomain,
				// ...(usersUrl === request.url ? {
				//     'Context-Tenant-Id': currentTenantId
				// } : {})
			},
		});

		return next.handle(newRequest);
	}
}

