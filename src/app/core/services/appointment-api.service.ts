import { Injectable } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AddAppointmentRequestData,
  Appointment,
  AppointmentSlot,
  AppointmentSlotsRequestData,
  UpdateDurationRequestData,
} from '../../shared/models/appointment.model';
import { AppointmentStatus } from '../../shared/models/status.model';
import { PhysicianApiService } from './physician.api.service';
import { StaffApiService } from './staff-api.service';
import { DashboardApiService } from './dashboard-api.service';

@Injectable({
  providedIn: 'root',
})
export class AppointmentApiService {
  private refreshAppointment$$ = new Subject<void>();

  private appointmentUrl = `${environment.serverBaseUrl}/appointment`;

  constructor(
    private physicianApiSvc: PhysicianApiService,
    private staffApiSvc: StaffApiService,
    private http: HttpClient,
    private dashboardApiService: DashboardApiService,
  ) {}

  public get appointment$(): Observable<Appointment[]> {
    return combineLatest([this.refreshAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllAppointments$()));
  }

  private fetchAllAppointments$(): Observable<Appointment[]> {
    return this.http.get<BaseResponse<Appointment[]>>(`${this.appointmentUrl}`).pipe(map((response) => response.data));
  }

  public changeAppointmentStatus$(changes: { id: number | string; newStatus: AppointmentStatus | null }[]): Observable<boolean> {
    // if (!changes.length) {
    //   return of(false);
    // }
    //
    // let changed = false;
    // changes.forEach((change) => {
    //   const index = this.appointments.findIndex((appointment) => appointment.id === +change.id);
    //   if (index !== -1 && change.newStatus !== null) {
    //     this.appointments[index] = {
    //       ...this.appointments[index],
    //       approval: change.newStatus,
    //     };
    //
    //     if (!changed) {
    //       changed = true;
    //     }
    //   }
    // });

    // this.refreshAppointment$$.next();
    //
    return of(true);
  }

  public deleteAppointment$(appointmentID: number): Observable<boolean> {
    return this.http.delete<BaseResponse<boolean>>(`${this.appointmentUrl}/${appointmentID}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshAppointment$$.next();
        this.dashboardApiService.refreshAppointments();
      }),
    );
  }

  public getAppointmentByID(appointmentID: number): Observable<Appointment | undefined> {
    let queryParams = new HttpParams();
    queryParams = queryParams.append('id', appointmentID);

    return combineLatest([this.refreshAppointment$$.pipe(startWith(''))]).pipe(
      switchMap(() =>
        this.http.get<BaseResponse<Appointment>>(`${this.appointmentUrl}`, { params: queryParams }).pipe(
          map((response) => {
            if (Array.isArray(response.data)) {
              return response.data[0];
            }
            return response.data;
          }),
          catchError((e) => {
            console.log('error', e);
            return of({} as Appointment);
          }),
        ),
      ),
    );
  }

  public saveAppointment$(requestData: AddAppointmentRequestData) {
    const { id, ...restData } = requestData;
    return this.http.post<BaseResponse<AddAppointmentRequestData>>(`${this.appointmentUrl}`, restData).pipe(map((response) => response.data));
  }

  public updateAppointment$(requestData: AddAppointmentRequestData) {
    const { id, ...restData } = requestData;
    return this.http.put<BaseResponse<AddAppointmentRequestData>>(`${this.appointmentUrl}/${id}`, restData).pipe(
      map((response) => response.data),
      tap(() => this.refreshAppointment$$.next()),
    );
  }

  public updateAppointmentDuration$(requestData: UpdateDurationRequestData): Observable<null> {
    const { id, ...restData } = requestData;

    return this.http.put<BaseResponse<null>>(`${this.appointmentUrl}/updateappointmentduration/${id}`, restData).pipe(
      map((response) => response?.data),
      tap(() => this.refreshAppointment$$.next()),
    );
  }

  public getSlots$(requestData: AppointmentSlotsRequestData): Observable<AppointmentSlot[]> {
    return this.http
      .post<BaseResponse<AppointmentSlot[]>>(`${environment.serverBaseUrl}/patientappointment/slots`, requestData)
      .pipe(map((res) => res?.data));
  }
}
