import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AvailabilityType, User, UserType } from '../../shared/models/user.model';
import { Status } from '../../shared/models/status';
import { WeekdayModel } from '../../shared/models/weekday.model';

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
      value: UserType.Secretary,
    },
  ];

  private users: User[] = [
    {
      id: 1,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.Radiologist,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Unavailable,
      deletedBy: null,
      gsm: '',
      examList: [1, 2, 3, 5, 6, 7, 8],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
        {
          id: 60,
          weekday: WeekdayModel.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
  ];

  constructor() {}

  public get generalUserTypes(): Observable<any[]> {
    return of(this.generalUsers);
  }
}
