import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Email, EmailTemplateRequestData } from 'src/app/shared/models/email-template.model';



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
    return this.http
      .get<BaseResponse<Email[]>>(`${environment.serverBaseUrl}/email`)
      .pipe(map((response) => response.data));
  }

  public updateEmailTemplate(requestData: EmailTemplateRequestData): Observable<EmailTemplateRequestData> {
    return this.http.put<BaseResponse<EmailTemplateRequestData>>(`${environment.serverBaseUrl}/email`, requestData).pipe(
      map((response) => response.data));
  }

  public getEmailTemplateById(id: number): Observable<Email> {
    console.log('id: ', id);
    return this.http.get<BaseResponse<Email>>(`${environment.serverBaseUrl}/email/${id}`).pipe(
        map((response) => response.data));
    }
  
}
