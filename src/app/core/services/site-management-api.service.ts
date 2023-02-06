import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';
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
    const { file, ...rest } = requestData;
    // this.siteManagementData = {
    //   ...rest,
    //   logo: file,
    //   id: requestData?.id ?? Math.random(),
    // };

    // return of('Saved');
    return this.http.post<BaseResponse<SiteManagement>>(`${environment.serverBaseUrl}/sitesetting`, rest).pipe(
      map(response => response.data)
    )
  }

  // public get siteManagementData$(): Observable<SiteManagement> {
  //   return of(this.siteManagementData);
  // }

  public get siteManagementData$(): Observable<SiteManagement> {
    return combineLatest([this.refreshSiteManagement$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchSiteManagement()));
  }

  private fetchSiteManagement(): Observable<SiteManagement> {
    return this.http.get<BaseResponse<SiteManagement>>(`${environment.serverBaseUrl}/sitesetting`).pipe(map((response) => response.data));
  }
}
