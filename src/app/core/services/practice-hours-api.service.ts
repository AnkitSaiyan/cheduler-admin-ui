import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { PracticeAvailability } from '../../shared/models/practice.model';

@Injectable({
  providedIn: 'root',
})
export class PracticeHoursApiService {
  private practiceHours: PracticeAvailability[] = [];

  constructor(private http: HttpClient) {}

  public get practiceHours$(): Observable<PracticeAvailability[]> {
    return of(this.practiceHours);
  }

  public savePracticeHours$(requestData: PracticeAvailability[]): Observable<PracticeAvailability[]> {
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
    return this.http.post<BaseResponse<PracticeAvailability[]>>(`${environment.serverBaseUrl}/practice`, requestData).pipe(
      map(response => response.data)
    )
  }
}
