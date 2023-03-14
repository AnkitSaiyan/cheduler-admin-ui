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
  UpdateRadiologistRequestData,
} from '../../shared/models/appointment.model';
import { AppointmentStatus, ChangeStatusRequestData } from '../../shared/models/status.model';
import { PhysicianApiService } from './physician.api.service';
import { StaffApiService } from './staff-api.service';
import { DashboardApiService } from './dashboard-api.service';
import { Exam } from '../../shared/models/exam.model';
import { Room } from '../../shared/models/rooms.model';
import { User } from '../../shared/models/user.model';

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

  public fetchAllAppointments$(data?: any): Observable<Appointment[]> {
    if (data) {
      const queryParams = {};
      if (data.appointmentNumber) queryParams['id'] = data.appointmentNumber;
      if (data.roomsId) queryParams['roomId'] = data.roomsId;
      if (data.examList) queryParams['examId'] = data.examList;
      if (data.doctorId) queryParams['doctorId'] = data.doctorId;
      if (data.startedAt) queryParams['startDate'] = data.startedAt;
      if (data.endedAt) queryParams['endDate'] = data.endedAt;

      return this.http.get<BaseResponse<Appointment[]>>(`${this.appointmentUrl}`, { params: queryParams }).pipe(
        map((response) => {
          if (!response?.data?.length) {
            return [];
          }

          const appointments = response.data;

          if (!appointments?.length) {
            return [];
          }

          return appointments.map((appointment) => this.getAppointmentModified(appointment));
        }),
      );
    }
    return this.http.get<BaseResponse<Appointment[]>>(`${this.appointmentUrl}`).pipe(
      map((response) => {
        if (!response?.data?.length) {
          return [];
        }

        const appointments = response.data;

        if (!appointments?.length) {
          return [];
        }

        return appointments.map((appointment) => this.getAppointmentModified(appointment));
      }),
    );
  }

  private getAppointmentModified(appointment: Appointment): Appointment {
    const examIdToRooms: { [key: number]: Room[] } = {};
    const examIdToUsers: { [key: number]: User[] } = {};

    if (appointment.roomsDetail?.length) {
      appointment?.roomsDetail?.forEach((room) => {
        if (!examIdToRooms[+room.examId]) {
          examIdToRooms[+room.examId] = [];
        }
        examIdToRooms[+room.examId].push(room);
      });
    }

    if (appointment.usersDetail?.length) {
      appointment?.usersDetail?.forEach((user) => {
        if (!examIdToUsers[+user.examId]) {
          examIdToUsers[+user.examId] = [];
        }
        examIdToUsers[+user.examId].push(user);
      });
    }

    let startedAt;
    let endedAt;

    const ap = {
      ...appointment,
      exams: appointment.exams.map((exam) => {
        if (exam.startedAt && (!startedAt || new Date(exam.startedAt) < startedAt)) {
          startedAt = new Date(exam.startedAt);
        }

        if (exam.endedAt && (!endedAt || new Date(exam.endedAt) > endedAt)) {
          endedAt = new Date(exam.endedAt);
        }

        return {
          ...exam,
          rooms: examIdToRooms[+exam.id],
          allUsers: exam?.users ?? [],
          users: examIdToUsers[+exam.id],
        };
      }),
    };

    ap.startedAt = startedAt;
    ap.endedAt = endedAt;

    return ap;
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
      switchMap(() =>
        this.http.get<BaseResponse<Appointment>>(`${this.appointmentUrl}/${appointmentID}`).pipe(
          map((response) => {
            if (!response?.data) {
              return {} as Appointment;
            }
            return this.getAppointmentModified(response.data);
          }),
        ),
      ),
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
    return this.http.put<BaseResponse<null>>(`${this.appointmentUrl}/updateappointmentduration`, requestData).pipe(
      map((response) => response?.data),
      tap(() => this.refreshAppointment$$.next()),
    );
  }

  public getSlots$(requestData: AppointmentSlotsRequestData): Observable<AppointmentSlot[]> {
    return this.http
      .post<BaseResponse<AppointmentSlot[]>>(`${environment.serverBaseUrl}/patientappointment/slots`, requestData)
      .pipe(map((res) => res?.data));
  }

  public updateRadiologist$(requestData: UpdateRadiologistRequestData): Observable<any> {
    return this.http.put<BaseResponse<any>>(`${this.appointmentUrl}/updateradiologist`, requestData).pipe(
      map((res) => res?.data),
      tap(() => this.refreshAppointment$$.next()),
    );
  }
}
