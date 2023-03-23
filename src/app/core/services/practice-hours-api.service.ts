import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, Subject, combineLatest, startWith, switchMap, tap, catchError } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { PracticeAvailabilityServer } from '../../shared/models/practice.model';
import { TimeSlot } from '../../shared/models/calendar.model';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root',
})
export class PracticeHoursApiService {
  private refreshPracticeHours$$ = new Subject<void>();

  constructor(private http: HttpClient, private loaderSvc: LoaderService) {}

  public get practiceHours$(): Observable<PracticeAvailabilityServer[]> {
    return combineLatest([this.refreshPracticeHours$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPractices$()));
  }

  private fetchPractices$(): Observable<any> {
    this.loaderSvc.spinnerActivate();
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<PracticeAvailabilityServer[]>>(`${environment.serverBaseUrl}/practice`).pipe(
      map((response) => response.data),
      tap(() => {
        this.loaderSvc.deactivate();
        this.loaderSvc.spinnerDeactivate();
      }),
      catchError((error) => of({})),
    );
  }

  public savePracticeHours$(requestData: TimeSlot[]): Observable<PracticeAvailabilityServer[]> {
    this.loaderSvc.activate();
    return this.http.post<BaseResponse<PracticeAvailabilityServer[]>>(`${environment.serverBaseUrl}/practice`, requestData).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPracticeHours$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }
}
