import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap, takeUntil } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { AddRoomRequestData, Room, RoomsGroupedByType, RoomType, UpdateRoomPlaceInAgendaRequestData } from '../../shared/models/rooms.model';
import { ChangeStatusRequestData, Status } from '../../shared/models/status.model';
import { LoaderService } from './loader.service';
import { ShareDataService } from './share-data.service';
import { Translate } from '../../shared/models/translate.model';

@Injectable({
  providedIn: 'root',
})
export class RoomsApiService extends DestroyableComponent {
  private roomTypes: { name: string; value: string }[] = [
    {
      name: 'Private',
      value: RoomType.Private,
    },
    {
      name: 'Public',
      value: RoomType.Public,
    },
  ];

  private refreshRooms$$ = new Subject<void>();

  private readonly roomUrl = `${environment.schedulerApiUrl}/room`;

  private selectedLang$$ = new BehaviorSubject<string>('');

  constructor(private shareDataSvc: ShareDataService, private http: HttpClient, private loaderSvc: LoaderService) {
    super();

    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe({
        next: (lang) => this.selectedLang$$.next(lang)
      });
  }

  public get rooms$(): Observable<Room[]> {
    return combineLatest([this.refreshRooms$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchRooms()));
  }

  get fileTypes$(): Observable<any[]> {
    return combineLatest([this.selectedLang$$.pipe(startWith(''))]).pipe(
      switchMap(([lang]) => {
        return of(this.roomTypes).pipe(
          map((downloadTypeItems) => {
            if (lang) {
              return downloadTypeItems.map((downloadType) => {
                return {
                  ...downloadType,
                  name: Translate[downloadType.name][lang],
                };
              });
            }
            return downloadTypeItems;
          }),
        );
      }),
    );
  }

  private fetchRooms(): Observable<Room[]> {
    this.loaderSvc.activate();
    this.loaderSvc.spinnerActivate();
    return this.http.get<BaseResponse<Room[]>>(`${this.roomUrl}`).pipe(
      map((response) =>
        response.data.sort((r1, r2) => {
          return r1.placeInAgenda - r2.placeInAgenda;
        }),
      ),
      tap(() => {
        this.loaderSvc.deactivate();
        this.loaderSvc.spinnerDeactivate();
      }),
    );
  }

  public get allRooms$(): Observable<Room[]> {
    return combineLatest([this.refreshRooms$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllRooms$()));
  }

  private fetchAllRooms$(): Observable<Room[]> {
    this.loaderSvc.activate();
    this.loaderSvc.spinnerActivate();

    return this.http.get<BaseResponse<Room[]>>(`${environment.schedulerApiUrl}/common/getrooms`).pipe(
      map((response) =>
        response.data.sort((r1, r2) => {
          return r1.placeInAgenda - r2.placeInAgenda;
        }),
      ),
      tap(() => {
        this.loaderSvc.deactivate();
        this.loaderSvc.spinnerDeactivate();
      }),
    );
  }

  public getRoomByID(roomID: number): Observable<Room> {
    this.loaderSvc.spinnerActivate();
    // return combineLatest([this.refreshRooms$$.pipe(startWith(''))]).pipe(switchMap(() => of(this.rooms.find((room) => +room.id === +roomID))));
    return combineLatest([this.refreshRooms$$.pipe(startWith(''))]).pipe(
      switchMap(() => {
        return this.http.get<BaseResponse<Room>>(`${this.roomUrl}/${roomID}`).pipe(
          map((response) => response.data),
          tap(() => {
            this.loaderSvc.spinnerDeactivate();
          }),
        );
      }),
    );
  }

  public changeRoomStatus$(requestData: ChangeStatusRequestData[]): Observable<null> {
    this.loaderSvc.activate();
    return this.http.put<BaseResponse<any>>(`${this.roomUrl}/updateroomstatus`, requestData).pipe(
      map((resp) => resp?.data),
      tap(() => {
        this.refreshRooms$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public addRoom$(requestData: AddRoomRequestData): Observable<Room> {
    this.loaderSvc.activate();
    return this.http.post<BaseResponse<Room>>(`${this.roomUrl}`, requestData).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshRooms$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public editRoom$(requestData: AddRoomRequestData): Observable<Room> {
    this.loaderSvc.activate();
    const { id, ...restData } = requestData;
    return this.http.put<BaseResponse<Room>>(`${this.roomUrl}/${id}`, restData).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshRooms$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public deleteRoom(roomID: number) {
    this.loaderSvc.activate();
    return this.http.delete<BaseResponse<Boolean>>(`${this.roomUrl}/${roomID}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshRooms$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public getRoomTypes(): Observable<{ name: string; value: string }[]> {
    return of(this.roomTypes);
  }

  public get roomsGroupedByType$(): Observable<RoomsGroupedByType> {
    return this.allRooms$.pipe(
      map((rooms) => {
        const roomsGroupedByType: RoomsGroupedByType = { private: [], public: [] };
        rooms.forEach((room) => {
          if (room.status === Status.Inactive) {
            return;
          }

          if (room.type === RoomType.Public) {
            roomsGroupedByType.public.push(room);
          } else if (room.type === RoomType.Private) {
            roomsGroupedByType.private.push(room);
          }
        });
        return roomsGroupedByType;
      }),
    );
  }

  public updatePlaceInAgenda$(requestData: UpdateRoomPlaceInAgendaRequestData[]): Observable<null> {
    this.loaderSvc.activate();
    return this.http.put<BaseResponse<any>>(`${this.roomUrl}`, requestData).pipe(
      map((resp) => resp?.data),
      tap(() => {
        this.refreshRooms$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }
}
