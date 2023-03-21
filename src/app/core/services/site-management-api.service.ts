import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, startWith, Subject, switchMap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { SiteManagement, SiteManagementRequestData } from '../../shared/models/site-management.model';

@Injectable({
  providedIn: 'root',
})
export class SiteManagementApiService {
  private siteManagementData!: SiteManagement;

  private refreshSiteManagement$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  public saveSiteManagementData$(requestData: SiteManagementRequestData): Observable<SiteManagement> {
    const formData = new FormData();
    formData.append('Name', requestData.name);
    formData.append('DisableAppointment', String(requestData.disableAppointment));
    formData.append('DisableWarningText', String(requestData.disableWarningText));
    formData.append('IntroductoryText', requestData.introductoryText);
    formData.append('DoctorReferringConsent', String(requestData.doctorReferringConsent));
    formData.append('Address', requestData.address);
    formData.append('Email', requestData.email);
    formData.append('Telephone', String(requestData.telephone));
    formData.append('isSlotsCombinable', String(requestData.isSlotsCombinable));
    formData.append('cancelAppointmentTime', String(requestData.cancelAppointmentTime));
    formData.append('ReminderTime', String(requestData.reminderTime));
    formData.append('isAppointmentAutoconfirm', String(requestData.isAppointmentAutoconfirm));
    if (requestData.file) {
      formData.append('File', requestData.file);
    }

    return this.http.post<BaseResponse<SiteManagement>>(`${environment.serverBaseUrl}/sitesetting`, formData).pipe(
      map((response) => response.data),
      // tap(() => this.refreshSiteManagement$.next()),
    );
  }

  public get siteManagementData$(): Observable<SiteManagement> {
    return combineLatest([this.refreshSiteManagement$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchSiteManagement()));
  }

  private fetchSiteManagement(): Observable<SiteManagement> {
    return this.http.get<BaseResponse<SiteManagement>>(`${environment.serverBaseUrl}/sitesetting`).pipe(map((response) => response.data));
  }
}
