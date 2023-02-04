import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, of, pipe, startWith, Subject, switchMap, tap } from 'rxjs';
import { Absence, AddAbsenceRequestDate, PriorityType } from '../../shared/models/absence.model';
import { Status } from '../../shared/models/status';
import { RoomType } from '../../shared/models/rooms.model';
import { AvailabilityType, UserType } from '../../shared/models/user.model';
import { Weekday } from '../../shared/models/calendar.model';
import { StaffApiService } from './staff-api.service';
import { DashboardApiService } from './dashboard-api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from "../../../environments/environment";
import { BaseResponse } from 'src/app/shared/models/base-response.model';
@Injectable({
  providedIn: 'root',
})
export class AbsenceApiService {
  private absences: Absence[] = [
    {
      id: 1,
      name: 'Wedding',
      isHoliday: false,
      startedAt: new Date(),
      endedAt: new Date(),
      priority: PriorityType.Low,
      info: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet asperiores atque, aut consectetur, consequuntur ducimus ea explicabo ipsam laboriosam maxime, necessitatibus quam quisquam repudiandae veritatis vitae voluptatem. Delectus, ipsum.',
      status: Status.Active,
      isRepeat: false,
      repeatType: undefined,
      repeatFrequency: undefined,
      repeatDays: '',
      roomList: [1, 2],
      staffList: [1, 2],
      rooms: [
        {
          id: 1,
          name: 'John Room',
          description: 'Test Room',
          type: RoomType.Public,
          availabilityType: AvailabilityType.Available,
          status: Status.Inactive,
          placeInAgenda: 0,
          roomNo: 1,
          practiceAvailability: [],
          examLists: [1, 2],
        },
      ],
      staff: [
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
              weekday: Weekday.MON,
              dayStart: new Date(),
              dayEnd: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Wedding',
      isHoliday: false,
      startedAt: new Date(),
      endedAt: new Date(),
      priority: PriorityType.Low,
      info: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet asperiores atque, aut consectetur, consequuntur ducimus ea explicabo ipsam laboriosam maxime, necessitatibus quam quisquam repudiandae veritatis vitae voluptatem. Delectus, ipsum.',
      status: Status.Active,
      isRepeat: false,
      repeatType: undefined,
      repeatFrequency: undefined,
      repeatDays: '',
      roomList: [1, 2],
      staffList: [1, 2],
      rooms: [
        {
          id: 1,
          name: 'John Room',
          description: 'Test Room',
          type: RoomType.Public,
          availabilityType: AvailabilityType.Available,
          status: Status.Inactive,
          placeInAgenda: 0,
          roomNo: 1,
          practiceAvailability: [],
          examLists: [1, 2],
        },
      ],
      staff: [
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
              weekday: Weekday.MON,
              dayStart: new Date(),
              dayEnd: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: 3,
      name: 'Wedding',
      isHoliday: false,
      startedAt: new Date(),
      endedAt: new Date(),
      priority: PriorityType.Low,
      info: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet asperiores atque, aut consectetur, consequuntur ducimus ea explicabo ipsam laboriosam maxime, necessitatibus quam quisquam repudiandae veritatis vitae voluptatem. Delectus, ipsum.',
      status: Status.Active,
      isRepeat: false,
      repeatType: undefined,
      repeatFrequency: undefined,
      repeatDays: '',
      roomList: [1, 2],
      staffList: [1, 2],
      rooms: [
        {
          id: 1,
          name: 'John Room',
          description: 'Test Room',
          type: RoomType.Public,
          availabilityType: AvailabilityType.Available,
          status: Status.Inactive,
          placeInAgenda: 0,
          roomNo: 1,
          practiceAvailability: [],
          examLists: [1, 2],
        },
      ],
      staff: [
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
              weekday: Weekday.MON,
              dayStart: new Date(),
              dayEnd: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: 4,
      name: 'Wedding',
      isHoliday: false,
      startedAt: new Date(),
      endedAt: new Date(),
      priority: PriorityType.Low,
      info: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet asperiores atque, aut consectetur, consequuntur ducimus ea explicabo ipsam laboriosam maxime, necessitatibus quam quisquam repudiandae veritatis vitae voluptatem. Delectus, ipsum.',
      status: Status.Active,
      isRepeat: false,
      repeatType: undefined,
      repeatFrequency: undefined,
      repeatDays: '',
      roomList: [1, 2],
      staffList: [1, 2],
      rooms: [
        {
          id: 1,
          name: 'John Room',
          description: 'Test Room',
          type: RoomType.Public,
          availabilityType: AvailabilityType.Available,
          status: Status.Inactive,
          placeInAgenda: 0,
          roomNo: 1,
          practiceAvailability: [],
          examLists: [1, 2],
        },
      ],
      staff: [
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
              weekday: Weekday.MON,
              dayStart: new Date(),
              dayEnd: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: 5,
      name: 'Wedding',
      isHoliday: false,
      startedAt: new Date(),
      endedAt: new Date(),
      priority: PriorityType.Low,
      info: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet asperiores atque, aut consectetur, consequuntur ducimus ea explicabo ipsam laboriosam maxime, necessitatibus quam quisquam repudiandae veritatis vitae voluptatem. Delectus, ipsum.',
      status: Status.Active,
      isRepeat: false,
      repeatType: undefined,
      repeatFrequency: undefined,
      repeatDays: '',
      roomList: [1, 2],
      staffList: [1, 2],
      rooms: [
        {
          id: 1,
          name: 'John Room',
          description: 'Test Room',
          type: RoomType.Public,
          availabilityType: AvailabilityType.Available,
          status: Status.Inactive,
          placeInAgenda: 0,
          roomNo: 1,
          practiceAvailability: [],
          examLists: [1, 2],
        },
      ],
      staff: [
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
              weekday: Weekday.MON,
              dayStart: new Date(),
              dayEnd: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: 5,
      name: 'Wedding',
      isHoliday: false,
      startedAt: new Date(),
      endedAt: new Date(),
      priority: PriorityType.Low,
      info: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet asperiores atque, aut consectetur, consequuntur ducimus ea explicabo ipsam laboriosam maxime, necessitatibus quam quisquam repudiandae veritatis vitae voluptatem. Delectus, ipsum.',
      status: Status.Active,
      isRepeat: false,
      repeatType: undefined,
      repeatFrequency: undefined,
      repeatDays: '',
      roomList: [1, 2],
      staffList: [1, 2],
      rooms: [
        {
          id: 1,
          name: 'John Room',
          description: 'Test Room',
          type: RoomType.Public,
          availabilityType: AvailabilityType.Available,
          status: Status.Inactive,
          placeInAgenda: 0,
          roomNo: 1,
          practiceAvailability: [],
          examLists: [1, 2],
        },
      ],
      staff: [
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
              weekday: Weekday.MON,
              dayStart: new Date(),
              dayEnd: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: 6,
      name: 'Wedding',
      isHoliday: false,
      startedAt: new Date(),
      endedAt: new Date(),
      priority: PriorityType.Low,
      info: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet asperiores atque, aut consectetur, consequuntur ducimus ea explicabo ipsam laboriosam maxime, necessitatibus quam quisquam repudiandae veritatis vitae voluptatem. Delectus, ipsum.',
      status: Status.Active,
      isRepeat: false,
      repeatType: undefined,
      repeatFrequency: undefined,
      repeatDays: '',
      roomList: [1, 2],
      staffList: [1, 2],
      rooms: [
        {
          id: 1,
          name: 'John Room',
          description: 'Test Room',
          type: RoomType.Public,
          availabilityType: AvailabilityType.Available,
          status: Status.Inactive,
          placeInAgenda: 0,
          roomNo: 1,
          practiceAvailability: [],
          examLists: [1, 2],
        },
      ],
      staff: [
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
              weekday: Weekday.MON,
              dayStart: new Date(),
              dayEnd: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: 7,
      name: 'Casual leave',
      isHoliday: false,
      startedAt: new Date(),
      endedAt: new Date(),
      priority: PriorityType.Low,
      info: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet asperiores atque, aut consectetur, consequuntur ducimus ea explicabo ipsam laboriosam maxime, necessitatibus quam quisquam repudiandae veritatis vitae voluptatem. Delectus, ipsum.',
      status: Status.Active,
      isRepeat: false,
      repeatType: undefined,
      repeatFrequency: undefined,
      repeatDays: '',
      roomList: [1, 2],
      staffList: [1, 2],
      rooms: [
        {
          id: 1,
          name: 'John Room',
          description: 'Test Room',
          type: RoomType.Public,
          availabilityType: AvailabilityType.Available,
          status: Status.Inactive,
          placeInAgenda: 0,
          roomNo: 1,
          practiceAvailability: [],
          examLists: [1, 2],
        },
      ],
      staff: [
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
              weekday: Weekday.MON,
              dayStart: new Date(),
              dayEnd: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: 8,
      name: 'Wedding',
      isHoliday: false,
      startedAt: new Date(),
      endedAt: new Date(),
      priority: PriorityType.Low,
      info: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet asperiores atque, aut consectetur, consequuntur ducimus ea explicabo ipsam laboriosam maxime, necessitatibus quam quisquam repudiandae veritatis vitae voluptatem. Delectus, ipsum.',
      status: Status.Active,
      isRepeat: false,
      repeatType: undefined,
      repeatFrequency: undefined,
      repeatDays: '',
      roomList: [1, 2],
      staffList: [1, 2],
      rooms: [
        {
          id: 1,
          name: 'John Room',
          description: 'Test Room',
          type: RoomType.Public,
          availabilityType: AvailabilityType.Available,
          status: Status.Inactive,
          placeInAgenda: 0,
          roomNo: 1,
          practiceAvailability: [],
          examLists: [1, 2],
        },
      ],
      staff: [
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
              weekday: Weekday.MON,
              dayStart: new Date(),
              dayEnd: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: 9,
      name: 'Sick',
      isHoliday: false,
      startedAt: new Date(),
      endedAt: new Date(),
      priority: PriorityType.Low,
      info: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet asperiores atque, aut consectetur, consequuntur ducimus ea explicabo ipsam laboriosam maxime, necessitatibus quam quisquam repudiandae veritatis vitae voluptatem. Delectus, ipsum.',
      status: Status.Active,
      isRepeat: false,
      repeatType: undefined,
      repeatFrequency: undefined,
      repeatDays: '',
      roomList: [1, 2],
      staffList: [1, 2],
      rooms: [
        {
          id: 1,
          name: 'John Room',
          description: 'Test Room',
          type: RoomType.Public,
          availabilityType: AvailabilityType.Available,
          status: Status.Inactive,
          placeInAgenda: 0,
          roomNo: 1,
          practiceAvailability: [],
          examLists: [1, 2],
        },
      ],
      staff: [
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
              weekday: Weekday.MON,
              dayStart: new Date(),
              dayEnd: new Date(),
            },
          ],
        },
      ],
    },
    {
      id: 10,
      name: 'Wedding',
      isHoliday: false,
      startedAt: new Date(),
      endedAt: new Date(),
      priority: PriorityType.Low,
      info: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid amet asperiores atque, aut consectetur, consequuntur ducimus ea explicabo ipsam laboriosam maxime, necessitatibus quam quisquam repudiandae veritatis vitae voluptatem. Delectus, ipsum.',
      status: Status.Active,
      isRepeat: false,
      repeatType: undefined,
      repeatFrequency: undefined,
      repeatDays: '',
      roomList: [1, 2],
      staffList: [1, 2],
      rooms: [
        {
          id: 1,
          name: 'John Room',
          description: 'Test Room',
          type: RoomType.Public,
          availabilityType: AvailabilityType.Available,
          status: Status.Inactive,
          placeInAgenda: 0,
          roomNo: 1,
          practiceAvailability: [],
          examLists: [1, 2],
        },
      ],
      staff: [
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
              weekday: Weekday.MON,
              dayStart: new Date(),
              dayEnd: new Date(),
            },
          ],
        },
      ],
    },
  ];

  private refreshAbsences$$ = new Subject<void>();

  constructor(private staffApiSvc: StaffApiService, private http: HttpClient) {}

  public get absences$(): Observable<Absence[]> {
    return combineLatest([this.refreshAbsences$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllAbsence()));
  }

  
  private fetchAllAbsence(): Observable<Absence[]> {
    return this.http
      .get<BaseResponse<Absence[]>>(`${environment.serverBaseUrl}/absences`)
      .pipe(map((response) => response.data));
  }


  public getAbsenceByID$(absenceID: number): Observable<Absence> {
    return combineLatest([this.refreshAbsences$$.pipe(startWith(''))]).pipe(
        switchMap(() => this.fetchAbsenceById(absenceID))
      )
    }

  private fetchAbsenceById(absenceID: number): Observable<Absence> {
    return this.http
    .get<BaseResponse<Absence>>(`${environment.serverBaseUrl}/absences/${absenceID}`)
    .pipe(map((response) => response.data));
  }

  public deleteAbsence(absenceID: number) {
    console.log("called");
    
    // const index = this.absences.findIndex((absence) => absence.id === +absenceID);
    // if (index !== -1) {
    //   this.absences.splice(index, 1);
    //   this.refreshAbsences$$.next();
    // }

    return this.http.delete<any>(`${environment.serverBaseUrl}/${absenceID}`).pipe(
      tap(()=>{this.refreshAbsences$$.next()}),
      map((response) => response.data)
    )
  }

  public upsertAbsence$(requestData: AddAbsenceRequestDate): Observable<any> {
    // if (!requestData) {
    //   return of('');
    // }

    return this.http.post<BaseResponse<Absence>>(`${environment.serverBaseUrl}/absences`, requestData).pipe(
        tap(()=>{this.refreshAbsences$$.next()}),
        map((response) => response.data)
      )
    

    // if (requestData?.id) {
    //   const index = this.absences.findIndex((absence) => absence.id === requestData.id);
    //   if (index !== -1) {
    //     this.absences[index] = {
    //       ...this.absences[index],
    //       id: requestData.id,
    //       name: requestData.name,
    //       startedAt: new Date(requestData.startedAt),
    //       endedAt: new Date(requestData.endedAt),
    //       isRepeat: requestData.isRepeat,
    //       isHoliday: requestData.isHoliday,
    //       priority: requestData.priority,
    //       repeatType: requestData?.repeatType ?? this.absences[index].repeatType,
    //       repeatFrequency: requestData.repeatFrequency,
    //       repeatDays: requestData?.repeatDays ?? this.absences[index].repeatDays,
    //       info: requestData.info,
    //       roomList: requestData.roomList,
    //       staffList: requestData.staffList,
    //       status: this.absences[index].status,
    //     };
    //   }
    // } else {
    //   this.http.post<BaseResponse<Absence>>(`${environment.serverBaseUrl}/absence`, {
    //     name: requestData.name,
    //     startedAt: new Date(requestData.startedAt),
    //     endedAt: new Date(requestData.endedAt),
    //     isRepeat: requestData.isRepeat,
    //     isHoliday: requestData.isHoliday,
    //     priority: requestData.priority,
    //     repeatType: requestData?.repeatType,
    //     repeatFrequency: requestData?.repeatFrequency,
    //     repeatDays: requestData?.repeatDays,
    //     info: requestData.info,
    //     status: Status.Active,
    //     staffList: requestData.staffList,
    //     roomList: requestData.roomList,
    //     staff: [],
    //     rooms: [],
    //   }).pipe(map(response => response))

    // {  this.absences.push({
    //   id: Math.random(),
    //   name: requestData.name,
    //   startedAt: new Date(requestData.startedAt),
    //   endedAt: new Date(requestData.endedAt),
    //   isRepeat: requestData.isRepeat,
    //   isHoliday: requestData.isHoliday,
    //   priority: requestData.priority,
    //   repeatType: requestData?.repeatType,
    //   repeatFrequency: requestData?.repeatFrequency,
    //   repeatDays: requestData?.repeatDays,
    //   info: requestData.info,
    //   status: Status.Active,
    //   staffList: requestData.staffList,
    //   roomList: requestData.roomList,
    //   staff: [],
    //   rooms: [],
    // });}
    // }

    this.refreshAbsences$$.next();

    return of('created');
  }
}
