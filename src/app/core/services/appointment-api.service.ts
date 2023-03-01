import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, shareReplay, startWith, Subject, switchMap, tap } from 'rxjs';
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
import { AppointmentStatus, ChangeStatusRequestData } from '../../shared/models/status.model';
import { PhysicianApiService } from './physician.api.service';
import { StaffApiService } from './staff-api.service';
import { DashboardApiService } from './dashboard-api.service';
import {Exam} from "../../shared/models/exam.model";

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
    return this.http.get<BaseResponse<Appointment[]>>(`${this.appointmentUrl}`).pipe(map((response) => {
      if (!response?.data?.length) {
        return [];
      }

      return response.data.map((appointment) => {
        return {
          ...appointment,
          startedAt: appointment.exams.sort((a, b) => {
            return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
          })[0]?.startedAt,
          endedAt: appointment.exams.sort((a, b) => {
            return new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime();
          })[0]?.endedAt,
        };
      });
    }));
  }

  public changeAppointmentStatus$(requestData: ChangeStatusRequestData[]): Observable<boolean> {
    return this.http.put<BaseResponse<boolean>>(`${this.appointmentUrl}/updateappointmentstatus`, requestData).pipe(
      map((resp) => resp?.data),
      tap(() => this.refreshAppointment$$.next()),
    );
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

  public getAppointmentByID$(appointmentID: number): Observable<Appointment | undefined> {
    return combineLatest([this.refreshAppointment$$.pipe(startWith(''))]).pipe(
      switchMap(() => this.http.get<BaseResponse<Appointment>>(`${this.appointmentUrl}/${appointmentID}`).pipe(map((response) => response.data))),
    );
  }

  public saveAppointment$(requestData: AddAppointmentRequestData): Observable<Appointment> {
    const { id, ...restData } = requestData;
    return this.http.post<BaseResponse<Appointment>>(`${this.appointmentUrl}`, restData).pipe(map((response) => response.data));
  }

  public updateAppointment$(requestData: AddAppointmentRequestData): Observable<Appointment> {
    const { id, ...restData } = requestData;
    return this.http.put<BaseResponse<Appointment>>(`${this.appointmentUrl}/${id}`, restData).pipe(
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
