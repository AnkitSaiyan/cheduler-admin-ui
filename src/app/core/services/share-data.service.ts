import { Injectable } from '@angular/core';
import { combineLatest, BehaviorSubject, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { ENG_BE } from 'src/app/shared/utils/const';

@Injectable({
  providedIn: 'root',
})
export class ShareDataService {
  private changeTimeModalData$$ = new BehaviorSubject<any>(null);

  private date$$ = new BehaviorSubject<any>(null);

  private language$$ = new BehaviorSubject<string>(ENG_BE);

  private refreshRooms$$ = new Subject<void>();

  private readonly patientsUrl = `${environment.serverBaseUrl}/common/getpatients`;

  constructor(private http: HttpClient) {}

  public getChangeTimeModalData$(): Observable<any> {
    return this.changeTimeModalData$$.asObservable();
  }

  public setChangeTimeModalData(data: any) {
    this.changeTimeModalData$$.next(data);
  }

  public getDate$(): Observable<Date> {
    return this.date$$.asObservable();
  }

  public setDate(date: Date) {
    this.date$$.next(date);
  }

  public setLanguage(languge: string) {
    this.language$$.next(languge);
  }

  public getLanguage$(): Observable<string> {
    return this.language$$.asObservable();
  }

  public get patient$(): Observable<any> {
    return combineLatest([this.refreshRooms$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPatients()));
  }

  private fetchPatients(): Observable<any> {
    return this.http.get<BaseResponse<any>>(`${this.patientsUrl}`).pipe(
      map((response) => {
        return response['data'];
      }),
    );
  }
}
