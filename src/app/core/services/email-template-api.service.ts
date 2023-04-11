import { Injectable } from '@angular/core';

import { combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Email, EmailTemplateRequestData } from 'src/app/shared/models/email-template.model';
import { ChangeStatusRequestData } from 'src/app/shared/models/status.model';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root',
})
export class EmailTemplateApiService {
  private emailTemplates$$ = new Subject<void>();

  constructor(private http: HttpClient, private loaderSvc: LoaderService) {}

  public get emailTemplates$(): Observable<Email[]> {
    return combineLatest([this.emailTemplates$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllEmailTemplates()));
  }

  private fetchAllEmailTemplates(): Observable<Email[]> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<Email[]>>(`${environment.schedulerApiUrl}/email`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public updateEmailTemplate(requestData: EmailTemplateRequestData): Observable<EmailTemplateRequestData> {
    this.loaderSvc.activate();

    const { id, ...restData } = requestData;
    return this.http.put<BaseResponse<EmailTemplateRequestData>>(`${environment.schedulerApiUrl}/email/${id}`, requestData).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public changeEmailStatus$(requestData: ChangeStatusRequestData[]): Observable<boolean> {
    this.loaderSvc.activate();
    return this.http.put<BaseResponse<any>>(`${environment.schedulerApiUrl}/email/updateemailtemplatestatus`, requestData).pipe(
      map((resp) => resp?.data),
      tap(() => {
        this.emailTemplates$$.next();
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
        this.emailTemplates$$.next();
        this.loaderSvc.deactivate();
        this.loaderSvc.spinnerDeactivate();
      }),
    );
  }
}
