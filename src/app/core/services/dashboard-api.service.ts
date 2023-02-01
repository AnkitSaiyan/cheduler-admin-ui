import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, startWith, Subject, switchMap } from 'rxjs';
import { Absence } from 'src/app/shared/models/absence.model';
import { Appointment } from 'src/app/shared/models/appointment.model';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { Room } from 'src/app/shared/models/rooms.model';
import { environment } from '../../../environments/environment';

export interface PostIt {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  constructor(private http: HttpClient) {}

  private refreshAppointment = new Subject<void>();
  private refreshNotification = new Subject<void>();
  private refreshRoomAbsence = new Subject<void>();

  public get appointment$(): Observable<Appointment[]> {
    return combineLatest([this.refreshAppointment.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllAppointments()));
  }

  private fetchAllAppointments(): Observable<Appointment[]> {
    return this.http
      .get<BaseResponse<Appointment[]>>(`${environment.serverBaseUrl}/appointment/getnewandunconfirmedlist`)
      .pipe(map((response) => response.data));
  }

  public get notification$(): Observable<any[]> {
    return combineLatest([this.refreshNotification.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllNotifications()));
  }

  private fetchAllNotifications(): Observable<any[]> {
    return this.http.get<BaseResponse<any[]>>(`${environment.serverBaseUrl}/dashboard/notifications`).pipe(map((response) => response.data));
  }

  public get roomAbsence$(): Observable<any[]> {
    return combineLatest([this.refreshRoomAbsence.pipe(startWith(''))]).pipe(switchMap(() => this.fetchRoomAbsence()));
  }

  private fetchRoomAbsence(): Observable<Room[]> {
    return this.http.get<BaseResponse<Room[]>>(`${environment.serverBaseUrl}/dashboard/roomabsences`).pipe(map((response) => response.data));
  }

  public get recentPatient$(): Observable<any[]> {
    return combineLatest([this.refreshRoomAbsence.pipe(startWith(''))]).pipe(switchMap(() => this.fetchRecentPatients()));
  }

  private fetchRecentPatients(): Observable<Room[]> {
    return this.http.get<BaseResponse<Room[]>>(`${environment.serverBaseUrl}/dashboard/recentpatients`).pipe(map((response) => response.data));
  }

  public get posts$(): Observable<any[]> {
    return combineLatest([this.refreshRoomAbsence.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPosts()));
  }

  private fetchPosts(): Observable<PostIt[]> {
    return this.http.get<BaseResponse<PostIt[]>>(`${environment.serverBaseUrl}/postit`).pipe(map((response) => response.data));
  }
}

