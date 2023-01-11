import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SiteManagement, SiteManagementRequestData } from '../../shared/models/site-management.model';

@Injectable({
  providedIn: 'root',
})
export class SiteManagementApiService {
  private siteManagementData!: SiteManagement;

  constructor() {}

  public saveSiteManagementData$(requestData: SiteManagementRequestData): Observable<string> {
    const { file, ...rest } = requestData;
    this.siteManagementData = {
      ...rest,
      logo: file,
      id: requestData?.id ?? Math.random(),
    };

    return of('Saved');
  }

  public get siteManagementData$(): Observable<SiteManagement> {
    return of(this.siteManagementData);
  }
}
