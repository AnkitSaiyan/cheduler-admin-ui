import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UserType } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private generalUsers: any[] = [
    {
      name: 'Assistant',
      value: UserType.Assistant,
    },
    {
      name: 'Radiologist',
      value: UserType.Radiologist,
    },
    {
      name: 'Nursing',
      value: UserType.Nursing,
    },
    {
      name: 'Secretary',
      value: UserType.Scheduler,
    },
  ];

  constructor() {}

  public get generalUserTypes(): Observable<any[]> {
    return of(this.generalUsers);
  }
}
