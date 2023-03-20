import { Injectable } from '@angular/core';

import { combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Email, EmailTemplateRequestData } from 'src/app/shared/models/email-template.model';
import { ChangeStatusRequestData } from 'src/app/shared/models/status.model';

@Injectable({
  providedIn: 'root',
})
export class EmailTemplateApiService {
  private emailTemplates$$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  public get emailTemplates$(): Observable<Email[]> {
    return combineLatest([this.emailTemplates$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllEmailTemplates()));
  }

  private fetchAllEmailTemplates(): Observable<Email[]> {
    return this.http.get<BaseResponse<Email[]>>(`${environment.serverBaseUrl}/email`).pipe(map((response) => response.data));
  }

  public updateEmailTemplate(requestData: EmailTemplateRequestData): Observable<EmailTemplateRequestData> {
    console.log('requestData: ', requestData);
    const { id, ...restData } = requestData;
    return this.http
      .put<BaseResponse<EmailTemplateRequestData>>(`${environment.serverBaseUrl}/email/${id}`, requestData)
      .pipe(map((response) => response.data));
  }

  public changeEmailStatus$(requestData: ChangeStatusRequestData[]): Observable<boolean> {
    return this.http.put<BaseResponse<any>>(`${environment.serverBaseUrl}/email/updateemailtemplatestatus`, requestData).pipe(
      map((resp) => resp?.data),
      tap(() => this.emailTemplates$$.next()),
    );
  }

  public getEmailTemplateById(id: number): Observable<Email> {
    console.log('id: ', id);
    return this.http.get<BaseResponse<Email>>(`${environment.serverBaseUrl}/email/${id}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.emailTemplates$$.next();
      }),
    );
  }
}





