import { Injectable } from '@angular/core';
import { combineLatest, Observable, of, startWith, Subject, switchMap } from 'rxjs';
import { Absence, AddAbsenceRequestDate } from '../../shared/models/absence.model';
import { Status } from '../../shared/models/status';

@Injectable({
  providedIn: 'root',
})
export class AbsenceApiService {
  private absences: Absence[] = [];

  private refreshAbsences$$ = new Subject<void>();

  constructor() {}

  public get absences$(): Observable<Absence[]> {
    return combineLatest([this.refreshAbsences$$.pipe(startWith(''))]).pipe(switchMap(() => of(this.absences)));
  }

  public getAbsenceByID$(absenceID: number): Observable<Absence | undefined> {
    return combineLatest([this.refreshAbsences$$.pipe(startWith(''))]).pipe(
      switchMap(() => of(this.absences.find((absence) => +absence.id === +absenceID))),
    );
  }

  public deleteAbsence(absenceID: number) {
    const index = this.absences.findIndex((absence) => absence.id === +absenceID);
    if (index !== -1) {
      this.absences.splice(index, 1);
      this.refreshAbsences$$.next();
    }
  }

  public upsertAbsence$(requestData: AddAbsenceRequestDate): Observable<string> {
    if (!requestData) {
      return of('');
    }

    if (requestData?.id) {
      const index = this.absences.findIndex((absence) => absence.id === requestData.id);
      if (index !== -1) {
        this.absences[index] = {
          ...this.absences[index],
          id: requestData.id,
          name: requestData.name,
          startedAt: new Date(requestData.startedAt),
          endedAt: new Date(requestData.endedAt),
          isRepeat: requestData.isRepeat,
          isHoliday: requestData.isHoliday,
          priority: requestData.priority,
          info: requestData.info,
          roomList: requestData.roomList,
          staffList: requestData.staffList,
          status: this.absences[index].status,
        };
      }
    } else {
      this.absences.push({
        id: Math.random(),
        name: requestData.name,
        startedAt: new Date(requestData.startedAt),
        endedAt: new Date(requestData.endedAt),
        isRepeat: requestData.isRepeat,
        isHoliday: requestData.isHoliday,
        priority: requestData.priority,
        info: requestData.info,
        status: Status.Active,
      });
    }

    this.refreshAbsences$$.next();

    return of('created');
  }
}
