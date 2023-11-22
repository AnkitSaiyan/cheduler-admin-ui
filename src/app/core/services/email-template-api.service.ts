import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Email, EmailTemplateRequestData } from 'src/app/shared/models/email-template.model';
import { ChangeStatusRequestData } from 'src/app/shared/models/status.model';
import { LoaderService } from './loader.service';

@Injectable({
	providedIn: 'root',
})
export class EmailTemplateApiService {
	private emailTemplates$$ = new Subject<void>();

	private pageNo$$ = new BehaviorSubject<number>(1);

	constructor(private http: HttpClient, private loaderSvc: LoaderService) {}

	public set pageNo(pageNo: number) {
		this.pageNo$$.next(pageNo);
	}

	public get pageNo(): number {
		return this.pageNo$$.value;
	}

	public get emailTemplates$(): Observable<BaseResponse<Email[]>> {
		return combineLatest([this.emailTemplates$$.pipe(startWith('')), this.pageNo$$]).pipe(
			switchMap(([_, pageNo]) => this.fetchAllEmailTemplates(pageNo)),
		);
	}

	private fetchAllEmailTemplates(pageNo: number): Observable<BaseResponse<Email[]>> {
		this.loaderSvc.activate();

		const params = new HttpParams().append('pageNo', pageNo);
		return this.http.get<BaseResponse<Email[]>>(`${environment.schedulerApiUrl}/email`, { params }).pipe(tap(() => this.loaderSvc.deactivate()));
	}

	public updateEmailTemplate(requestData: EmailTemplateRequestData): Observable<EmailTemplateRequestData> {
		this.loaderSvc.activate();

		const { id, ...restData } = requestData;
		return this.http.put<BaseResponse<EmailTemplateRequestData>>(`${environment.schedulerApiUrl}/email/${id}`, requestData).pipe(
			map((response) => response.data),
			tap(() => {
				this.pageNo$$.next(1);
				this.loaderSvc.deactivate();
			}),
		);
	}

	public changeEmailStatus$(requestData: ChangeStatusRequestData[]): Observable<boolean> {
		this.loaderSvc.activate();
		return this.http.put<BaseResponse<any>>(`${environment.schedulerApiUrl}/email/updateemailtemplatestatus`, requestData).pipe(
			map((resp) => resp?.data),
			tap(() => {
				this.pageNo$$.next(1);
				this.loaderSvc.deactivate();
			}),
		);
	}

	public getEmailTemplateById(id: number): Observable<Email> {
		this.loaderSvc.activate();
		this.loaderSvc.spinnerActivate();

		return this.http.get<BaseResponse<Email>>(`${environment.schedulerApiUrl}/email/${id}`).pipe(
			map((response) => response.data),
			tap(() => {
				this.loaderSvc.deactivate();
				this.loaderSvc.spinnerDeactivate();
			}),
		);
	}
}
