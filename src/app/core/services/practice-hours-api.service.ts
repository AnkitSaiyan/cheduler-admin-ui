import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { PracticeAvailabilityServer } from '../../shared/models/practice.model';

@Injectable({
  providedIn: 'root',
})
export class PracticeHoursApiService {
  private practiceHours: PracticeAvailabilityServer[] = [];

  constructor(private http: HttpClient) {}

  public get practiceHours$(): Observable<PracticeAvailabilityServer[]> {
    return of(this.practiceHours);
  }

  public savePracticeHours$(requestData: PracticeAvailabilityServer[]): Observable<PracticeAvailabilityServer[]> {
    // if (requestData?.length) {
    //   requestData.forEach((practice) => {
    //     if (practice?.id) {
    //       const index = this.practiceHours.findIndex((pa) => pa.id === practice.id);
    //       if (index !== -1) {
    //         this.practiceHours[index] = { ...practice };
    //       }
    //     } else {
    //       this.practiceHours.push({
    //         ...practice,
    //         id: Math.random(),
    //       });
    //     }
    //   });

    //   return of('saved');
    // }
    return this.http
      .post<BaseResponse<PracticeAvailabilityServer[]>>(`${environment.serverBaseUrl}/practice`, requestData)
      .pipe(map((response) => response.data));
  }
}
