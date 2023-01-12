import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, Observable, of, startWith, Subject, switchMap } from 'rxjs';
import { AvailabilityType, User, UserType } from '../../shared/models/user.model';
import { Status } from '../../shared/models/status';
import { AddStaffRequestData } from '../../shared/models/staff.model';
import { WeekdayModel } from '../../shared/models/weekday.model';
import { PracticeAvailability } from '../../shared/models/practice.model';

@Injectable({
  providedIn: 'root',
})
export class StaffApiService {
  private staffLists: User[] = [
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
        {
          id: 60,
          weekday: WeekdayModel.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 2,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [1],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.MON,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 3,
      firstname: 'David',
      lastname: 'Warner',
      userType: UserType.General,
      email: 'david@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Unavailable,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 4,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.SAT,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 5,
      firstname: 'Jennifer',
      lastname: 'Woodley',
      userType: UserType.General,
      email: 'jennifer@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Unavailable,
      deletedBy: null,
      gsm: '',
      examList: [1, 2],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.THU,
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
    {
      id: 6,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.SUN,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
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
    {
      id: 7,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.Scheduler,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Unavailable,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 8,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 9,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.Assistant,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Unavailable,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [],
    },
    {
      id: 10,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 11,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.WED,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 12,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.General,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Active,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.FRI,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
    {
      id: 13,
      firstname: 'Maaike',
      lastname: 'Benooit',
      userType: UserType.Radiologist,
      email: 'maaike@deflexmo.be',
      telephone: '9812345678',
      address: '',
      status: Status.Inactive,
      availabilityType: AvailabilityType.Available,
      deletedBy: null,
      gsm: '',
      examList: [],
      practiceAvailability: [
        {
          id: 60,
          weekday: WeekdayModel.THU,
          dayStart: new Date(),
          dayEnd: new Date(),
        },
      ],
    },
  ];

  private refreshStaffs$$ = new Subject();

  constructor(private http: HttpClient) {}

  public get staffList$(): Observable<User[]> {
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(switchMap(() => of(this.staffLists)));
  }

  public upsertStaff$(requestData: AddStaffRequestData): Observable<string> {
    if (!requestData) {
      return of('');
    }

    if (requestData.id) {
      const index = this.staffLists.findIndex((staff) => staff.id === requestData.id);
      if (index !== -1) {
        this.staffLists[index] = {
          ...this.staffLists[index],
          id: requestData.id,
          firstname: requestData.firstname,
          lastname: requestData.lastname,
          userType: requestData.userType,
          email: requestData.email,
          telephone: requestData.telephone,
          address: requestData?.address ?? this.staffLists[index].address,
          status: Status.Active,
          availabilityType: AvailabilityType.Available,
          deletedBy: null,
          gsm: requestData.gsm ?? this.staffLists[index].gsm,
          examList: requestData?.examLists ?? this.staffLists[index].examList,
          practiceAvailability: requestData.practiceAvailability ?? (this.staffLists[index].practiceAvailability as PracticeAvailability[]),
          info: requestData?.info ?? this.staffLists[index].info,
        };

        console.log(requestData);
      }
    } else {
      this.staffLists.push({
        id: Math.random(),
        firstname: requestData.firstname,
        lastname: requestData.lastname,
        userType: requestData.userType,
        email: requestData.email,
        telephone: requestData.telephone,
        address: requestData?.address ?? '',
        status: Status.Active,
        availabilityType: AvailabilityType.Available,
        deletedBy: null,
        gsm: requestData.gsm ?? '',
        examList: requestData?.examLists ?? [],
        practiceAvailability: requestData.practiceAvailability ?? ([] as PracticeAvailability[]),
        info: requestData?.info ?? '',
      });
    }

    this.refreshStaffs$$.next('');

    return of('created');
  }

  public changeStaffStatus$(changes: { id: number | string; newStatus: Status | null }[]): Observable<boolean> {
    if (!changes.length) {
      return of(false);
    }

    let changed = false;
    changes.forEach((change) => {
      const index = this.staffLists.findIndex((staff) => staff.id === +change.id);
      if (index !== -1 && change.newStatus !== null) {
        this.staffLists[index] = {
          ...this.staffLists[index],
          status: change.newStatus,
        };

        if (!changed) {
          changed = true;
        }
      }
    });

    this.refreshStaffs$$.next('');

    return of(true);
  }

  public deleteStaff(staffID: number) {
    const index = this.staffLists.findIndex((staff) => staff.id === +staffID);
    if (index !== -1) {
      this.staffLists.splice(index, 1);
      this.refreshStaffs$$.next('');
    }
  }

  public getStaffByID(staffID: number): Observable<User | undefined> {
    return combineLatest([this.refreshStaffs$$.pipe(startWith(''))]).pipe(
      switchMap(() => of(this.staffLists.find((staff) => +staff.id === +staffID))),
    );
  }
}
