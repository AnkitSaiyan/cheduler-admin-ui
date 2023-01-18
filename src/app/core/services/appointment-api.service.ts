import { Injectable } from '@angular/core';
import { Observable, of, startWith, Subject, combineLatest, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppointmentApiService {
  private appointment: any = {};

  private refreshAppointment = new Subject<void>();

  constructor() {}

  public get appointment$(): Observable<any> {
    return combineLatest([this.refreshAppointment.pipe(startWith(''))]).pipe(switchMap(() => of(this.appointment)));
  }

  public upsertAppointment$(requestData: any): Observable<string> {
    this.appointment = requestData;
    this.refreshAppointment.next();
    return of('Saved');
  }
}
