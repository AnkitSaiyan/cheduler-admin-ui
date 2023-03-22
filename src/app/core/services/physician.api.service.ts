import { Injectable } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { AddPhysicianRequestData, Physician } from '../../shared/models/physician.model';
import { ChangeStatusRequestData } from '../../shared/models/status.model';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root',
})
export class PhysicianApiService {
  private readonly doctorUrl = `${environment.serverBaseUrl}/doctor`;

  private refreshPhysicians$$ = new Subject<void>();

  constructor(private http: HttpClient, private loaderSvc: LoaderService) {}

  public get physicians$(): Observable<Physician[]> {
    return combineLatest([this.refreshPhysicians$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllPhysicians()));
  }

  private fetchAllPhysicians(): Observable<Physician[]> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<Physician[]>>(`${environment.serverBaseUrl}/doctor`).pipe(
      map((response) => response.data?.map((p) => ({ ...p, fullName: `${p.firstname} ${p.lastname}` })).sort((p1, p2) => p2.id - p1.id)),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public getPhysicianByID(physicianID: number): Observable<Physician | undefined> {
    this.loaderSvc.activate();
    return combineLatest([this.refreshPhysicians$$.pipe(startWith(''))]).pipe(
      switchMap(() =>
        this.http.get<BaseResponse<Physician>>(`${environment.serverBaseUrl}/doctor/${physicianID}`).pipe(
          map((response) => response.data),
          tap(() => this.loaderSvc.deactivate()),
          catchError((e) => {
            return of({} as Physician);
          }),
        ),
      ),
    );
  }

  public changePhysicianStatus$(requestData: ChangeStatusRequestData[]): Observable<null> {
    this.loaderSvc.activate();
    return this.http.put<BaseResponse<any>>(`${this.doctorUrl}/updatedoctorstatus`, requestData).pipe(
      map((resp) => resp?.data),
      tap(() => {
        this.refreshPhysicians$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public addPhysician$(requestData: AddPhysicianRequestData): Observable<Physician> {
    this.loaderSvc.activate();
    return this.http.post<BaseResponse<Physician>>(`${environment.serverBaseUrl}/doctor`, requestData).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPhysicians$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public updatePhysician$(requestData: AddPhysicianRequestData): Observable<Physician> {
    this.loaderSvc.activate();
    const { id, ...restData } = requestData;
    return this.http.put<BaseResponse<Physician>>(`${environment.serverBaseUrl}/doctor/${id}`, restData).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPhysicians$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public deletePhysician(physicianID: number) {
    this.loaderSvc.activate();
    return this.http.delete<BaseResponse<Boolean>>(`${environment.serverBaseUrl}/doctor/${physicianID}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPhysicians$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }
}
