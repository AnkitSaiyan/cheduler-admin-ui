import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, map, tap, Observable, startWith, Subject, switchMap, takeUntil, of, BehaviorSubject } from 'rxjs';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { TimeDurationType } from 'src/app/shared/models/calendar.model';
import { environment } from 'src/environments/environment';
import { SiteManagement, SiteManagementRequestData } from '../../shared/models/site-management.model';
import { LoaderService } from './loader.service';
import { ShareDataService } from './share-data.service';
import { Translate } from '../../shared/models/translate.model';

@Injectable({
  providedIn: 'root',
})
export class SiteManagementApiService extends DestroyableComponent {
  private siteManagementData!: SiteManagement;

  public timeDurations: { name: TimeDurationType; value: TimeDurationType }[] = [
    {
      name: 'Minutes',
      value: 'Minutes',
    },
    {
      name: 'Hours',
      value: 'Hours',
    },
    {
      name: 'Days',
      value: 'Days',
    },
  ];

  private refreshSiteManagement$ = new Subject<void>();

  private selectedLang$$ = new BehaviorSubject<string>('');

  constructor(private shareDataSvc: ShareDataService, private http: HttpClient, private loaderSvc: LoaderService) {
    super();
    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => {
        this.selectedLang$$.next(lang);
      });
  }

  public saveSiteManagementData$(requestData: SiteManagementRequestData): Observable<SiteManagement> {
    this.loaderSvc.activate();
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
      tap(() => this.loaderSvc.deactivate()),
      // tap(() => this.refreshSiteManagement$.next()),
    );
  }

  get fileTypes$(): Observable<any[]> {
    return combineLatest([this.selectedLang$$.pipe(startWith(''))]).pipe(
      switchMap(([lang]) => {
        return of(this.timeDurations).pipe(
          map((downloadTypeItems) => {
            if (lang) {
              return downloadTypeItems.map((downloadType) => {
                return {
                  ...downloadType,
                  name: Translate[downloadType.name][lang],
                };
              });
            }
            return downloadTypeItems;
          }),
        );
      }),
    );
  }

  public get siteManagementData$(): Observable<SiteManagement> {
    return combineLatest([this.refreshSiteManagement$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchSiteManagement()));
  }

  private fetchSiteManagement(): Observable<SiteManagement> {
    this.loaderSvc.spinnerActivate();
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<SiteManagement>>(`${environment.serverBaseUrl}/sitesetting`).pipe(
      map((response) => response.data),
      tap(() => {
        this.loaderSvc.deactivate();
        this.loaderSvc.spinnerDeactivate();
      }),
    );
  }
}
