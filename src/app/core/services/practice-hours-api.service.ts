import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PracticeAvailability } from '../../shared/models/practice.model';

@Injectable({
  providedIn: 'root',
})
export class PracticeHoursApiService {
  private practiceHours: PracticeAvailability[] = [];

  constructor() {}

  public get practiceHours$(): Observable<PracticeAvailability[]> {
    return of(this.practiceHours);
  }

  public savePracticeHours$(requestData: PracticeAvailability[]): Observable<string> {
    if (requestData?.length) {
      requestData.forEach((practice) => {
        if (practice?.id) {
          const index = this.practiceHours.findIndex((pa) => pa.id === practice.id);
          if (index !== -1) {
            this.practiceHours[index] = { ...practice };
          }
        } else {
          this.practiceHours.push({
            ...practice,
            id: Math.random(),
          });
        }
      });

      return of('saved');
    }

    return of('');
  }
}
