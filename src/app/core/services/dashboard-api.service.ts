import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, startWith, Subject, switchMap, tap } from 'rxjs';
import { Appointment } from 'src/app/shared/models/appointment.model';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { Exam } from 'src/app/shared/models/exam.model';
import { Physician } from 'src/app/shared/models/physician.model';
import { Room } from 'src/app/shared/models/rooms.model';
import { AppointmentStatus } from 'src/app/shared/models/status.model';
import { environment } from '../../../environments/environment';

export interface PostIt {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  constructor(private http: HttpClient) {}

  private refreshAppointment$$ = new Subject<void>();

  private refreshNotification$$ = new Subject<void>();

  private refreshRoomAbsence$$ = new Subject<void>();

  private refreshPost$$ = new Subject<void>();

  private refreshDoctors$$ = new Subject<void>();

  private upcommingAppointments$$ = new Subject<void>();

  private refreshAppointmentStatus$$ = new Subject<void>();

  private refreshWeeklyAppointment$$ = new Subject<void>();

  private refreshCompletedAppointment$$ = new Subject<void>();

  private refreshWeeklyCanceledAppointment$$ = new Subject<void>();

  private refreshWeeklyPatients$$ = new Subject<void>();

  private refreshCompleteAppointmentGrowth$$ = new Subject<void>();

  private refreshCanceledAppointmentGrowth$$ = new Subject<void>();

  private refreshYearlyAppointments$$ = new Subject<void>();

  public get appointment$(): Observable<Appointment[]> {
    return combineLatest([this.refreshAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllAppointments()));
  }

  private fetchAllAppointments(): Observable<Appointment[]> {
    return (
      this.http
        .get<BaseResponse<Appointment[]>>(`${environment.serverBaseUrl}/appointment`)
        // .get<BaseResponse<Appointment[]>>(`${environment.serverBaseUrl}/dashboard/appointments`)
        .pipe(map((response) => response.data))
    );
  }

  public get notification$(): Observable<Notification[]> {
    return combineLatest([this.refreshNotification$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllNotifications()));
  }

  private fetchAllNotifications(): Observable<Notification[]> {
    return this.http.get<BaseResponse<Notification[]>>(`${environment.serverBaseUrl}/dashboard/notifications`).pipe(map((response) => response.data));
  }

  public get roomAbsence$(): Observable<Room[]> {
    return combineLatest([this.refreshRoomAbsence$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchRoomAbsence()));
  }

  private fetchRoomAbsence(): Observable<Room[]> {
    return this.http.get<BaseResponse<Room[]>>(`${environment.serverBaseUrl}/dashboard/roomabsences`).pipe(map((response) => response.data));
  }

  public get recentPatient$(): Observable<Appointment[]> {
    return combineLatest([this.refreshRoomAbsence$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchRecentPatients()));
  }

  private fetchRecentPatients(): Observable<Appointment[]> {
    return this.http
      .get<BaseResponse<{ appointment: Appointment[] }>>(`${environment.serverBaseUrl}/dashboard/recentpatients`)
      .pipe(map((response) => response.data?.appointment));
  }

  public get posts$(): Observable<PostIt[]> {
    return combineLatest([this.refreshPost$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPosts()));
  }

  private fetchPosts(): Observable<PostIt[]> {
    return this.http.get<BaseResponse<PostIt[]>>(`${environment.serverBaseUrl}/postit`).pipe(map((response) => response.data));
  }

  // public upsertAppointment$(requestData: AddAppointmentRequestData): Observable<string> {
  // this.appointments = requestData;
  // if (requestData.id) {
  //   const index = this.appointments.findIndex((appointments) => appointments.id === requestData.id);
  //   if (index !== -1) {
  //     this.appointments[index] = {
  //       ...this.appointments[index],
  //       patientFname: requestData.patientFname ?? this.appointments[index].patientFname,
  //       patientLname: requestData.patientLname ?? this.appointments[index].patientLname,
  //       patientEmail: requestData.patientEmail ?? this.appointments[index].patientEmail,
  //       patientTel: requestData.patientTel ?? this.appointments[index].patientTel,
  //       doctorId: requestData.doctorId ?? this.appointments[index].doctorId,
  //       userId: requestData.userId ?? this.appointments[index].userId,
  //       approval: requestData.approval ?? this.appointments[index].approval,
  //       examList: requestData.examList ?? this.appointments[index].examList,
  //       startedAt: requestData.startedAt ?? this.appointments[index].startedAt,
  //       endedAt: requestData.startedAt
  //         ? new Date(new Date(requestData.startedAt).setDate(new Date(requestData.startedAt).getDate() + 2))
  //         : this.appointments[index].endedAt,
  //       roomType: requestData.roomType ?? this.appointments[index].roomType,
  //       comments: requestData.comments ?? this.appointments[index].comments,
  //     };

  //     if (requestData.doctorId) {
  //       this.physicianApiSvc.getPhysicianByID(+requestData.doctorId).subscribe((doctor) => {
  //         this.appointments[index].doctor = doctor as Physician;
  //       });
  //     }

  //     if (requestData.userId) {
  //       this.staffApiSvc.getStaffByID(+requestData.userId).subscribe((user) => {
  //         this.appointments[index].user = user as User;
  //       });
  //     }
  //   }
  // } else {
  //   this.appointments.push({
  //     id: Math.floor(Math.random() * 100),
  //     patientFname: requestData.patientFname,
  //     patientLname: requestData.patientLname,
  //     patientEmail: requestData.patientEmail,
  //     patientTel: requestData.patientTel,
  //     doctorId: requestData.doctorId,
  //     doctor: {} as Physician,
  //     userId: requestData.userId,
  //     user: {} as User,
  //     approval: requestData.approval ?? AppointmentStatus.Pending,
  //     examList: requestData.examList,
  //     startedAt: requestData.startedAt,
  //     endedAt: new Date(new Date(requestData.startedAt).setDate(new Date(requestData.startedAt).getDate() + 2)),
  //     roomType: requestData.roomType,
  //     comments: requestData.comments ?? '',
  //     readStatus: ReadStatus.Unread,
  //     rejectReason: '',
  //   });

  //   this.physicianApiSvc.getPhysicianByID(+requestData.doctorId).subscribe((doctor) => {
  //     this.appointments[this.appointments.length - 1].doctor = doctor as Physician;
  //   });

  //   this.staffApiSvc.getStaffByID(+requestData.userId).subscribe((user) => {
  //     this.appointments[this.appointments.length - 1].user = user as User;
  //   });
  // }

  // this.http.post<BaseResponse<AddAppointmentRequestData>>(`${environment.serverBaseUrl}/`)
  //   this.refreshAppointment$$.next();

  //   return of('Saved');
  // }

  addPost(requestData: PostIt): Observable<PostIt> {
    return this.http.post<BaseResponse<PostIt>>(`${environment.serverBaseUrl}/postit`, requestData).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPost$$.next();
      }),
    );
  }

  deletePost(id: number): Observable<PostIt> {
    return this.http.delete<BaseResponse<PostIt>>(`${environment.serverBaseUrl}/postit/${id}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPost$$.next();
      }),
    );
  }

  public get upcommingAppointment$(): Observable<Appointment[]> {
    return combineLatest([this.upcommingAppointments$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllUpcomingAppointment()));
  }

  private fetchAllUpcomingAppointment(): Observable<Appointment[]> {
    return this.http
      .get<BaseResponse<Appointment[]>>(`${environment.serverBaseUrl}/dashboard/upcomingappointments`)
      .pipe(map((response) => response.data));
  }

  public get doctors$(): Observable<Physician[]> {
    return combineLatest([this.refreshDoctors$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllRefferingDoctors()));
  }

  private fetchAllRefferingDoctors(): Observable<Physician[]> {
    return this.http.get<BaseResponse<Physician[]>>(`${environment.serverBaseUrl}/dashboard/doctors`).pipe(map((response) => response.data));
  }

  public get exams$(): Observable<Exam[]> {
    return combineLatest([this.refreshAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllExams()));
  }

  private fetchAllExams(): Observable<Exam[]> {
    return this.http.get<BaseResponse<Exam[]>>(`${environment.serverBaseUrl}/dashboard/exams`).pipe(map((response) => response.data));
  }

  public get appointmentStatus$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshAppointmentStatus$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllAppointmentStatus()));
  }

  private fetchAllAppointmentStatus(): Observable<AppointmentStatus> {
    return this.http
      .get<BaseResponse<AppointmentStatus>>(`${environment.serverBaseUrl}/dashboard/appointmentsstatus`)
      .pipe(map((response) => response.data));
  }

  public get weeklyAppointments$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshWeeklyAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllWeeklyAppointments()));
  }

  private fetchAllWeeklyAppointments(): Observable<AppointmentStatus> {
    return this.http
      .get<BaseResponse<AppointmentStatus>>(`${environment.serverBaseUrl}/dashboard/weeklyappointments`)
      .pipe(map((response) => response.data));
  }

  public get weeklyCompletedAppointments$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshCompletedAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllWeeklyCompletedAppointments()));
  }

  private fetchAllWeeklyCompletedAppointments(): Observable<AppointmentStatus> {
    return this.http
      .get<BaseResponse<AppointmentStatus>>(`${environment.serverBaseUrl}/dashboard/weeklycompletedappointments`)
      .pipe(map((response) => response.data));
  }

  public get weeklycancelledappointments$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshWeeklyCanceledAppointment$$.pipe(startWith(''))]).pipe(
      switchMap(() => this.fetchAllWeeklycancelledappointments()),
    );
  }

  private fetchAllWeeklycancelledappointments(): Observable<AppointmentStatus> {
    return this.http
      .get<BaseResponse<AppointmentStatus>>(`${environment.serverBaseUrl}/dashboard/weeklycancelledappointments`)
      .pipe(map((response) => response.data));
  }

  public get weeklyPatients$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshWeeklyCanceledAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchWeeklypatients()));
  }

  private fetchWeeklypatients(): Observable<AppointmentStatus> {
    return this.http
      .get<BaseResponse<AppointmentStatus>>(`${environment.serverBaseUrl}/dashboard/weeklypatients`)
      .pipe(map((response) => response.data));
  }

  public get completeAppointmentGrowth$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshCompleteAppointmentGrowth$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchCompleteAppointmentGrowth()));
  }

  private fetchCompleteAppointmentGrowth(): Observable<AppointmentStatus> {
    return this.http
      .get<BaseResponse<AppointmentStatus>>(`${environment.serverBaseUrl}/dashboard/completeappointmentgrowth`)
      .pipe(map((response) => response.data));
  }

  public get cancelledAppointmentGrowth$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshCanceledAppointmentGrowth$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchCancelledAppointmentGrowth()));
  }

  private fetchCancelledAppointmentGrowth(): Observable<AppointmentStatus> {
    return this.http
      .get<BaseResponse<AppointmentStatus>>(`${environment.serverBaseUrl}/dashboard/cancelledappointmentgrowth`)
      .pipe(map((response) => response.data));
  }

  public get yearlyAppointments$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshYearlyAppointments$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchYearlyAppointments()));
  }

  private fetchYearlyAppointments(): Observable<AppointmentStatus> {
    return this.http
      .get<BaseResponse<AppointmentStatus>>(`${environment.serverBaseUrl}/dashboard/yearlyappointments`)
      .pipe(map((response) => response.data));
  }

  public refreshAppointments() {
    this.refreshAppointment$$.next();
  }
}