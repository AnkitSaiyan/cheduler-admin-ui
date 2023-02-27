import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PrioritySlotApiService {
  private refreshPrioritySlots$$ = new Subject<void>();
  constructor(private http: HttpClient) {}
  prioritySlots: string = `${environment.serverBaseUrl}/priorityslot`;

  public get prioritySlots$(): Observable<PrioritySlot[]> {
    return combineLatest([this.refreshPrioritySlots$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllPrioritySlots()));
  }

  private fetchAllPrioritySlots(): Observable<PrioritySlot[]> {
    return this.http.get<BaseResponse<PrioritySlot[]>>(`${this.prioritySlots}`).pipe(map((response) => response.data));
  }

  public deletePrioritySlot$(slotID: number): Observable<boolean> {
    return this.http.delete<BaseResponse<boolean>>(`${this.prioritySlots}/${slotID}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPrioritySlots$$.next();
      }),
    );
  }

  public getPrioritySlotsByID(slotID: number): Observable<PrioritySlot | undefined> {
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
          catchError((e) => {
            console.log('error', e);
            return of({} as PrioritySlot);
          }),
        ),
      ),
    );
  }

  public savePrioritySlot$(requestData: PrioritySlot) {
    let { id, ...restData } = requestData;
    let queryParams = new HttpParams();
    queryParams.append('id', 0);
    requestData.id = id;
    return this.http.post<BaseResponse<PrioritySlot>>(`${this.prioritySlots}`,restData, {params:queryParams}).pipe(
      map((response) => response.data),
      tap(() => this.refreshPrioritySlots$$.next()),
    );
  }

  public updatePrioritySlot$(requestData: PrioritySlot) {
    console.log("67 update slot called api");
    
    let { id, ...restData } = requestData;
    let queryParams = new HttpParams();
    queryParams.append('id', String(id));
    console.log('id: ', id);
    console.log('restData: ', restData);
    return this.http.post<BaseResponse<PrioritySlot>>(`${this.prioritySlots}?id=${id}`, restData).pipe(
      map((response) => response.data),
      tap(() => this.refreshPrioritySlots$$.next()),
    );
  }
}