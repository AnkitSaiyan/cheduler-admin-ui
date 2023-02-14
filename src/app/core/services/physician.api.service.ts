import { Injectable } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { AddPhysicianRequestData, Physician } from '../../shared/models/physician.model';
import { ChangeStatusRequestData } from '../../shared/models/status.model';

@Injectable({
  providedIn: 'root',
})
export class PhysicianApiService {
  private readonly doctorUrl = `${environment.serverBaseUrl}/doctor`;

  private refreshPhysicians$$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  public get physicians$(): Observable<Physician[]> {
    return combineLatest([this.refreshPhysicians$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllPhysicians()));
  }

  private fetchAllPhysicians(): Observable<Physician[]> {
    return this.http
      .get<BaseResponse<Physician[]>>(`${environment.serverBaseUrl}/doctor`)
      .pipe(map((response) => response.data?.sort((p1, p2) => p2.id - p1.id)));
  }

  public getPhysicianByID(physicianID: number): Observable<Physician | undefined> {
    return combineLatest([this.refreshPhysicians$$.pipe(startWith(''))]).pipe(
      switchMap(() =>
        this.http.get<BaseResponse<Physician>>(`${environment.serverBaseUrl}/doctor/${physicianID}`).pipe(
          map((response) => response.data),
          catchError((e) => {
            console.log('error', e);
            return of({} as Physician);
          }),
        ),
      ),
    );
  }

  public changePhysicianStatus$(requestData: ChangeStatusRequestData[]): Observable<null> {
    return this.http.put<BaseResponse<any>>(`${this.doctorUrl}/updatedoctorstatus`, requestData).pipe(
      map((resp) => resp?.data),
      tap(() => this.refreshPhysicians$$.next()),
    );
  }

  public addPhysician$(requestData: AddPhysicianRequestData): Observable<Physician> {
    return this.http.post<BaseResponse<Physician>>(`${environment.serverBaseUrl}/doctor`, requestData).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPhysicians$$.next();
      }),
    );
  }

  public updatePhysician$(requestData: AddPhysicianRequestData): Observable<Physician> {
    const { id, ...restData } = requestData;
    return this.http.put<BaseResponse<Physician>>(`${environment.serverBaseUrl}/doctor/${id}`, restData).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPhysicians$$.next();
      }),
    );
  }

  public deletePhysician(physicianID: number) {
    return this.http.delete<BaseResponse<Boolean>>(`${environment.serverBaseUrl}/doctor/${physicianID}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPhysicians$$.next();
      }),
    );
  }
}
