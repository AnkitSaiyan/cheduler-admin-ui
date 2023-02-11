import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShareDataService {
  private changeTimeModalData$$ = new BehaviorSubject<any>(null);

  constructor() {}

  public getChangeTimeModalData$(): Observable<any> {
    return this.changeTimeModalData$$.asObservable();
  }

  public setChangeTimeModalData(data: any) {
    this.changeTimeModalData$$.next(data);
  }
}
