import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ENG_BE } from 'src/app/shared/utils/const';

@Injectable({
  providedIn: 'root',
})
export class ShareDataService {
  private changeTimeModalData$$ = new BehaviorSubject<any>(null);

  private date$$ = new BehaviorSubject<any>(null);

  private language$$ = new BehaviorSubject<string>(ENG_BE);

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

  public setLanguage(languge: string) {
    this.language$$.next(languge)
  }

  public getLanguage$(): Observable<string> {
    return this.language$$.asObservable();
  }
}
