import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap, takeUntil } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { environment } from 'src/environments/environment';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { LoaderService } from './loader.service';
import { RepeatType } from '../../shared/models/absence.model';
import { ShareDataService } from './share-data.service';
import { Translate } from '../../shared/models/translate.model';

@Injectable({
  providedIn: 'root',
})
export class PrioritySlotApiService extends DestroyableComponent {
  public repeatTypes = [
    {
      name: 'Daily',
      value: RepeatType.Daily,
    },
    {
      name: 'Weekly',
      value: RepeatType.Weekly,
    },
    {
      name: 'Monthly',
      value: RepeatType.Monthly,
    },
  ];

  private refreshPrioritySlots$$ = new Subject<void>();

  private selectedLang$$ = new BehaviorSubject<string>('');

  constructor(private shareDataSvc: ShareDataService, private http: HttpClient, private loaderSvc: LoaderService) {
    super();
    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => {
        this.selectedLang$$.next(lang);
      });
  }

  prioritySlots: string = `${environment.serverBaseUrl}/priorityslot`;

  public get prioritySlots$(): Observable<PrioritySlot[]> {
    return combineLatest([this.refreshPrioritySlots$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllPrioritySlots()));
  }

  private fetchAllPrioritySlots(): Observable<PrioritySlot[]> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<PrioritySlot[]>>(`${this.prioritySlots}`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  get fileTypes$(): Observable<any[]> {
    return combineLatest([this.selectedLang$$.pipe(startWith(''))]).pipe(
      switchMap(([lang]) => {
        return of(this.repeatTypes).pipe(
          map((downloadTypeItems) => {
            if (lang) {
              return downloadTypeItems.map((downloadType) => {
                return {
                  ...downloadType,
                  name: Translate[downloadType.name][lang],
                };
              });
            }
            return downloadTypeItems;
          }),
        );
      }),
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
            return of({} as PrioritySlot);
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
    );
  }
}
