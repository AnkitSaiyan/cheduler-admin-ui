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

		const sessionExp = localStorage.getItem('sessionExp');

		if (sessionExp && +sessionExp < new Date().getTime()) {

			localStorage.setItem('isSessionExpired', 'true')
			setTimeout(() => {
				this.userSvc.logout();
			}, 1500);

			return EMPTY;
		}

		GeneralUtils.saveSessionExpTime();

		const newRequest = request.clone({
			setHeaders: {
				SubDomain,
			},
		});

		return next.handle(newRequest);
	}
}


