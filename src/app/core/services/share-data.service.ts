import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShareDataService {
  private changeTimeModalData$$ = new BehaviorSubject<any>(null);

  private date$$ = new BehaviorSubject<any>(null);

  constructor() {}

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
}
