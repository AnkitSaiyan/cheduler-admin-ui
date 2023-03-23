import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap, throwError} from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { environment } from 'src/environments/environment';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root',
})
export class PrioritySlotApiService {
  private refreshPrioritySlots$$ = new Subject<void>();

  constructor(private http: HttpClient, private loaderSvc: LoaderService) {}

  prioritySlots: string = `${environment.serverBaseUrl}/priorityslot`;

  public get prioritySlots$(): Observable<PrioritySlot[]> {
    return combineLatest([this.refreshPrioritySlots$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllPrioritySlots()));
  }

  private fetchAllPrioritySlots(): Observable<PrioritySlot[]> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<PrioritySlot[]>>(`${this.prioritySlots}`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
      catchError((e) => {
        this.loaderSvc.deactivate();
        return throwError(e);
      })
    );
  }

  public deletePrioritySlot$(slotID: number): Observable<boolean> {
    this.loaderSvc.activate();
    return this.http.delete<BaseResponse<boolean>>(`${this.prioritySlots}/${slotID}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPrioritySlots$$.next();
        this.loaderSvc.deactivate();
      }),
      catchError((e) => {
        this.loaderSvc.deactivate();
        return throwError(e);
      })
    );
  }

  public getPrioritySlotsByID(slotID: number): Observable<PrioritySlot | undefined> {
    this.loaderSvc.activate();
    this.loaderSvc.spinnerActivate();

    let queryParams = new HttpParams();
    queryParams = queryParams.append('id', slotID);
    return combineLatest([this.refreshPrioritySlots$$.pipe(startWith(''))]).pipe(
      switchMap(() =>
        this.http.get<BaseResponse<PrioritySlot>>(`${this.prioritySlots}/${slotID}`).pipe(
          map((response) => {
            if (Array.isArray(response.data)) {
              return response.data[0];
            }
            return response.data;
          }),
          tap(() => {
            this.loaderSvc.deactivate();
            this.loaderSvc.spinnerDeactivate();
          }),
          catchError((e) => {
            this.loaderSvc.deactivate();
            return throwError(e);
          }),
        ),
      ),
    );
  }

  public savePrioritySlot$(requestData: PrioritySlot) {
    this.loaderSvc.activate();
    let { id, ...restData } = requestData;
    let queryParams = new HttpParams();
    queryParams.append('id', 0);
    requestData.id = id;
    return this.http.post<BaseResponse<PrioritySlot>>(`${this.prioritySlots}`, restData, { params: queryParams }).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPrioritySlots$$.next();
        this.loaderSvc.deactivate();
      }),
      catchError((e) => {
        this.loaderSvc.deactivate();
        return throwError(e);
      })
    );
  }

  public updatePrioritySlot$(requestData: PrioritySlot) {
    this.loaderSvc.activate();
    let { id, ...restData } = requestData;
    let queryParams = new HttpParams();
    queryParams.append('id', String(id));

    return this.http.post<BaseResponse<PrioritySlot>>(`${this.prioritySlots}?id=${id}`, restData).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPrioritySlots$$.next();
        this.loaderSvc.deactivate();
      }),
      catchError((e) => {
        this.loaderSvc.deactivate();
        return throwError(e);
      })
    );
  }
}
