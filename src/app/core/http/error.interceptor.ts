import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { NotificationDataService } from '../services/notification-data.service';
import { LoaderService } from '../services/loader.service';
import { HttpStatusCodes } from '../../shared/models/base-response.model';
import { ShareDataService } from '../services/share-data.service';
import { Translate } from '../../shared/models/translate.model';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
	private language = this.shareDataSvc.getLanguage();

	private errorMessage = Translate.Error.SomethingWrong[this.language];

	constructor(private notificationSvc: NotificationDataService, private loaderSvc: LoaderService, private shareDataSvc: ShareDataService) {
		this.shareDataSvc.getLanguage$().subscribe({
			next: (lang) => {
				this.language = lang;
			},
		});
	}

	public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		return next.handle(req).pipe(
			catchError((err) => {
				this.generateErrorMessage(err, this.language);
				this.stopLoaders();
				return throwError(() => err);
			}),
		);
	}

	private generateErrorMessage(err: any, lang: string): void {
		if (err.status === 401 || err.status === 403) {
			this.errorMessage = this.handleHttpStatusCodes(err.status, lang);
		} else if (err?.error?.errors) {
			this.errorMessage = this.handleGeneralErrors(err?.error?.errors);
		} else {
			this.errorMessage = this.handleBackendCodes(err?.error?.message, lang);
		}
		if (this.errorMessage !== 'MSG_400_APMT_AFFECTS') this.notificationSvc.showError(this.errorMessage);
	}

	private handleHttpStatusCodes(statusCode: number, lang: string): string {
		switch (statusCode) {
			case HttpStatusCodes.FORBIDDEN:
				return Translate.Error.Forbidden[lang];
			case HttpStatusCodes.UNAUTHORIZED:
				return Translate.Error.Unauthorized[lang];
			default:
				return Translate.Error.SomethingWrong[lang];
		}
	}

	private handleGeneralErrors(errors: any[] | string): string {
		if (Array.isArray(errors)) {
			errors.forEach((msg) => {
				this.errorMessage += `${msg} `;
			});
		} else if (typeof errors === 'string') {
			this.errorMessage = errors;
		}
		return this.errorMessage;
	}

	private handleBackendCodes(message: string, lang: string): string {
		return Translate.Error.BackendCodes[lang][message] || Translate.Error.SomethingWrong[lang];
	}

	private stopLoaders() {
		this.loaderSvc.deactivate();
		this.loaderSvc.spinnerDeactivate();
	}
}
