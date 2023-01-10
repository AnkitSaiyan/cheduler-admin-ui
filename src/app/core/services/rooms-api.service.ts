import { Injectable } from '@angular/core';
import { combineLatest, Observable, of, startWith, Subject, switchMap } from 'rxjs';
import { AddRoomRequestData, Room, RoomType } from '../../shared/models/rooms.model';
import { Status } from '../../shared/models/status';
import { AddStaffRequestData } from '../../shared/models/staff.model';
import { AvailabilityType } from '../../shared/models/user.model';
import { PracticeAvailability } from '../../shared/models/practice.model';

@Injectable({
  providedIn: 'root',
})
export class RoomsApiService {
  private rooms: Room[] = [
    {
      id: 1,
      name: 'John Room',
      description: 'Test Room',
      type: RoomType.Public,
      availabilityType: 2,
      status: Status.Inactive,
      placeInAgenda: 0,
      roomNo: 1,
      practiceAvailability: [],
      examLists: [1, 2],
    },
    {
      id: 2,
      name: 'Tim Room',
      description: 'General Room',
      type: RoomType.Private,
      availabilityType: 2,
      status: Status.Active,
      placeInAgenda: 0,
      roomNo: 1,
      practiceAvailability: [],
      examLists: [3, 4],
    },
    {
      id: 3,
      name: 'John Room',
      description: 'Test Room',
      type: RoomType.Public,
      availabilityType: 2,
      status: Status.Inactive,
      placeInAgenda: 0,
      roomNo: 1,
      practiceAvailability: [],
      examLists: [],
    },
    {
      id: 4,
      name: 'Tim Room',
      description: 'General Room',
      type: RoomType.Private,
      availabilityType: 2,
      status: Status.Active,
      placeInAgenda: 0,
      roomNo: 1,
      practiceAvailability: [],
      examLists: [],
    },
    {
      id: 5,
      name: 'John Room',
      description: 'Test Room',
      type: RoomType.Public,
      availabilityType: 2,
      status: Status.Inactive,
      placeInAgenda: 0,
      roomNo: 1,
      practiceAvailability: [],
      examLists: [],
    },
    {
      id: 6,
      name: 'Tim Room',
      description: 'General Room',
      type: RoomType.Private,
      availabilityType: 2,
      status: Status.Active,
      placeInAgenda: 0,
      roomNo: 1,
      practiceAvailability: [],
      examLists: [],
    },
    {
      id: 7,
      name: 'John Room',
      description: 'Test Room',
      type: RoomType.Public,
      availabilityType: 2,
      status: Status.Inactive,
      placeInAgenda: 0,
      roomNo: 1,
      practiceAvailability: [],
      examLists: [],
    },
    {
      id: 8,
      name: 'Tim Room',
      description: 'General Room',
      type: RoomType.Private,
      availabilityType: 2,
      status: Status.Active,
      placeInAgenda: 0,
      roomNo: 1,
      practiceAvailability: [],
      examLists: [],
    },
    {
      id: 9,
      name: 'John Room',
      description: 'Test Room',
      type: RoomType.Public,
      availabilityType: 2,
      status: Status.Inactive,
      placeInAgenda: 0,
      roomNo: 1,
      practiceAvailability: [],
      examLists: [],
    },
    {
      id: 10,
      name: 'Tim Room',
      description: 'General Room',
      type: RoomType.Private,
      availabilityType: 2,
      status: Status.Active,
      placeInAgenda: 0,
      roomNo: 1,
      practiceAvailability: [],
      examLists: [],
    },
  ];

  private refreshRooms$$ = new Subject<void>();

  constructor() {}

  public get rooms$(): Observable<Room[]> {
    return combineLatest([this.refreshRooms$$.pipe(startWith(''))]).pipe(switchMap(() => of(this.rooms)));
  }

  public getRoomByID(roomID: number): Observable<Room | undefined> {
    return combineLatest([this.refreshRooms$$.pipe(startWith(''))]).pipe(switchMap(() => of(this.rooms.find((room) => +room.id === +roomID))));
  }

  public changeRoomStatus$(changes: { id: number | string; newStatus: Status | null }[]): Observable<boolean> {
    if (!changes.length) {
      return of(false);
    }

    let changed = false;
    changes.forEach((change) => {
      const index = this.rooms.findIndex((room) => room.id === +change.id);
      if (index !== -1 && change.newStatus !== null) {
        this.rooms[index] = {
          ...this.rooms[index],
          status: change.newStatus,
        };

        if (!changed) {
          changed = true;
        }
      }
    });

    this.refreshRooms$$.next();

    return of(true);
  }

  public upsertRoom$(requestData: AddRoomRequestData): Observable<string> {
    if (!requestData) {
      return of('');
    }

    if (requestData?.id) {
      const index = this.rooms.findIndex((room) => room.id === requestData.id);
      if (index !== -1) {
        this.rooms[index] = {
          ...this.rooms[index],
          id: requestData.id,
          name: requestData.name,
          description: requestData.description,
          type: requestData.type,
          roomNo: requestData?.roomNo ?? 1,
          status: Status.Active,
          availabilityType: AvailabilityType.Available,
          practiceAvailability: requestData.practiceAvailability ?? ([] as PracticeAvailability[]),
        };

        console.log(requestData.practiceAvailability);
      }
    } else {
      this.rooms.push({
        id: Math.random(),
        name: requestData.name,
        description: requestData.description,
        type: requestData.type,
        roomNo: requestData?.roomNo ?? 1,
        status: Status.Active,
        availabilityType: AvailabilityType.Available,
        practiceAvailability: requestData.practiceAvailability ?? ([] as PracticeAvailability[]),
      });
    }

    this.refreshRooms$$.next();

    return of('created');
  }

  public deleteRoom(roomID: number) {
    const index = this.rooms.findIndex((room) => room.id === +roomID);
    if (index !== -1) {
      this.rooms.splice(index, 1);
      this.refreshRooms$$.next();
    }
  }
}
