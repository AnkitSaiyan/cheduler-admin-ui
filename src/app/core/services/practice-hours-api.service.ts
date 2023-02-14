import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, Subject, combineLatest, startWith, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { PracticeAvailabilityServer } from '../../shared/models/practice.model';

@Injectable({
  providedIn: 'root',
})
export class PracticeHoursApiService {
  private refreshPracticeHours$$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  public get practiceHours$(): Observable<PracticeAvailabilityServer[]> {
    return combineLatest([this.refreshPracticeHours$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPractices$()));
  }

  private fetchPractices$(): Observable<any> {
    return this.http.get<BaseResponse<PracticeAvailabilityServer[]>>(`${environment.serverBaseUrl}/practice`).pipe(map((response) => response.data));
  }

  public savePracticeHours$(requestData: PracticeAvailabilityServer[]): Observable<PracticeAvailabilityServer[]> {
    return this.http.post<BaseResponse<PracticeAvailabilityServer[]>>(`${environment.serverBaseUrl}/practice`, requestData).pipe(
      map((response) => response.data),
      // tap(() => this.refreshPracticeHours$$.next()),
    );
  }
}
