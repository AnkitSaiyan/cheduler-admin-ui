import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, startWith, Subject, switchMap, tap, takeUntil, of } from 'rxjs';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { Appointment } from 'src/app/shared/models/appointment.model';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { Exam } from 'src/app/shared/models/exam.model';
import { Physician } from 'src/app/shared/models/physician.model';
import { Room } from 'src/app/shared/models/rooms.model';
import { AppointmentStatus } from 'src/app/shared/models/status.model';
import { environment } from '../../../environments/environment';
import { LoaderService } from './loader.service';
import { ShareDataService } from './share-data.service';
import { Translate } from '../../shared/models/translate.model';
import { Notification } from '../../shared/models/notification.model';

export interface PostIt {
  message: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService extends DestroyableComponent {
  constructor(private shareDataSvc: ShareDataService, private http: HttpClient, private loaderSvc: LoaderService) {
    super();
    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe({
        next: (lang) => this.selectedLang$$.next(lang)
      });
  }

  private refreshAppointment$$ = new Subject<void>();

  private refreshNotification$$ = new Subject<void>();

  private refreshRoomAbsence$$ = new Subject<void>();

  private refreshPost$$ = new Subject<void>();

  private refreshAppointmentChart$$ = new Subject<void>();

  private refreshAppointmentBarChart$$ = new Subject<void>();

  private refreshPatientBarChart$$ = new Subject<void>();

  private refreshCompletedBarChart$$ = new Subject<void>();

  private refreshCancelledBarChart$$ = new Subject<void>();

  private refreshOverallLineChart$$ = new Subject<void>();

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

  public notificationData$$ = new BehaviorSubject<any>([]);

  public postItData$$ = new BehaviorSubject<any>([]);

  private selectedLang$$ = new BehaviorSubject<string>('');

  repeatTypes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  trnalsatedRepeatedTypes: any[] = [];

  public get appointment$(): Observable<Appointment[]> {
    return combineLatest([this.refreshAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllAppointments()));
  }

  get fileTypes$(): Observable<any[]> {
    return combineLatest([this.selectedLang$$.pipe(startWith(''))]).pipe(
      switchMap(([lang]) => {
        return of(this.repeatTypes).pipe(
          map((downloadTypeItems) => {
            if (lang) {
              this.trnalsatedRepeatedTypes = [];
              downloadTypeItems.map((downloadType) => {
                return this.trnalsatedRepeatedTypes.push(Translate[downloadType][lang]);
              });
            }
            return this.trnalsatedRepeatedTypes;
          }),
        );
      }),
    );
  }

  private fetchAllAppointments(): Observable<Appointment[]> {
    this.loaderSvc.activate();
    return (
      this.http
        .get<BaseResponse<Appointment[]>>(`${environment.schedulerApiUrl}/appointment`)
        // .get<BaseResponse<Appointment[]>>(`${environment.serverBaseUrl}/dashboard/appointments`)
        .pipe(
          map((response) => response.data),
          tap(() => this.loaderSvc.deactivate()),
        )
    );
  }

  public get notification$(): Observable<Notification[]> {
    return combineLatest([this.refreshNotification$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllNotifications()));
  }

  private fetchAllNotifications(): Observable<Notification[]> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<Notification[]>>(`${environment.schedulerApiUrl}/dashboard/notifications`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get roomAbsence$(): Observable<Room[]> {
    return combineLatest([this.refreshRoomAbsence$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchRoomAbsence()));
  }

  private fetchRoomAbsence(): Observable<Room[]> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<Room[]>>(`${environment.schedulerApiUrl}/dashboard/roomabsences`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get recentPatient$(): Observable<Appointment[]> {
    return combineLatest([this.refreshRoomAbsence$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchRecentPatients()));
  }

  private fetchRecentPatients(): Observable<Appointment[]> {
    this.loaderSvc.activate();
    return this.http
      .get<BaseResponse<{ appointment: Appointment[] }>>(`${environment.schedulerApiUrl}/dashboard/recentpatients`)
      .pipe(map((response) => response.data?.appointment));
  }

  public get posts$(): Observable<PostIt[]> {
    return combineLatest([this.refreshPost$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPosts()));
  }

  private fetchPosts(): Observable<PostIt[]> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/postit`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get appointmentChart$(): Observable<any> {
    return combineLatest([this.refreshAppointmentChart$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAppointmentChart()));
  }

  private fetchAppointmentChart(): Observable<any> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/dashboard/appointmentsstatus`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get appointmentBarChart$(): Observable<any> {
    return combineLatest([this.refreshAppointmentBarChart$$.pipe(startWith(''))]).pipe(switchMap(() => this.appointmentBarChart()));
  }

  private appointmentBarChart(): Observable<any> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/dashboard/weeklyappointments`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get patientsBarChart$(): Observable<any> {
    return combineLatest([this.refreshPatientBarChart$$.pipe(startWith(''))]).pipe(switchMap(() => this.patientsBarChart()));
  }

  private patientsBarChart(): Observable<any> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/dashboard/weeklypatients`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get completedBarChart$(): Observable<any> {
    return combineLatest([this.refreshCompletedBarChart$$.pipe(startWith(''))]).pipe(switchMap(() => this.completedBarChart()));
  }

  private completedBarChart(): Observable<any> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/dashboard/weeklycompletedappointments`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get cancelledBarChart$(): Observable<any> {
    return combineLatest([this.refreshCancelledBarChart$$.pipe(startWith(''))]).pipe(switchMap(() => this.cancelledBarChart()));
  }

  private cancelledBarChart(): Observable<any> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/dashboard/weeklycancelledappointments`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get overallStatusBarChart$(): Observable<any> {
    return combineLatest([this.refreshOverallLineChart$$.pipe(startWith(''))]).pipe(switchMap(() => this.overallStatusBarChart()));
  }

  private overallStatusBarChart(): Observable<any> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/dashboard/yearlyappointments`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
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

  addPost(message: string): Observable<PostIt> {
    this.loaderSvc.activate();
    return this.http.post<BaseResponse<PostIt>>(`${environment.schedulerApiUrl}/postit`, { message }).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPost$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  deletePost(id: number): Observable<PostIt> {
    this.loaderSvc.activate();
    return this.http.delete<BaseResponse<PostIt>>(`${environment.schedulerApiUrl}/postit/${id}`).pipe(
      map((response) => response.data),
      tap(() => {
        this.refreshPost$$.next();
        this.loaderSvc.deactivate();
      }),
    );
  }

  public get upcommingAppointment$(): Observable<Appointment[]> {
    this.loaderSvc.activate();
    return combineLatest([this.upcommingAppointments$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllUpcomingAppointment()));
  }

  private fetchAllUpcomingAppointment(): Observable<Appointment[]> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<Appointment[]>>(`${environment.schedulerApiUrl}/dashboard/upcomingappointments`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get doctors$(): Observable<Physician[]> {
    return combineLatest([this.refreshDoctors$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllRefferingDoctors()));
  }

  private fetchAllRefferingDoctors(): Observable<Physician[]> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<Physician[]>>(`${environment.schedulerApiUrl}/dashboard/doctors`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get exams$(): Observable<Exam[]> {
    return combineLatest([this.refreshAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllExams()));
  }

  private fetchAllExams(): Observable<Exam[]> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<Exam[]>>(`${environment.schedulerApiUrl}/dashboard/exams`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get appointmentStatus$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshAppointmentStatus$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllAppointmentStatus()));
  }

  private fetchAllAppointmentStatus(): Observable<AppointmentStatus> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<AppointmentStatus>>(`${environment.schedulerApiUrl}/dashboard/appointmentsstatus`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get weeklyAppointments$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshWeeklyAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllWeeklyAppointments()));
  }

  private fetchAllWeeklyAppointments(): Observable<AppointmentStatus> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<AppointmentStatus>>(`${environment.schedulerApiUrl}/dashboard/weeklyappointments`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get weeklyCompletedAppointments$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshCompletedAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllWeeklyCompletedAppointments()));
  }

  private fetchAllWeeklyCompletedAppointments(): Observable<AppointmentStatus> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<AppointmentStatus>>(`${environment.schedulerApiUrl}/dashboard/weeklycompletedappointments`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get weeklycancelledappointments$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshWeeklyCanceledAppointment$$.pipe(startWith(''))]).pipe(
      switchMap(() => this.fetchAllWeeklycancelledappointments()),
    );
  }

  private fetchAllWeeklycancelledappointments(): Observable<AppointmentStatus> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<AppointmentStatus>>(`${environment.schedulerApiUrl}/dashboard/weeklycancelledappointments`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get weeklyPatients$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshWeeklyCanceledAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchWeeklypatients()));
  }

  private fetchWeeklypatients(): Observable<AppointmentStatus> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<AppointmentStatus>>(`${environment.schedulerApiUrl}/dashboard/weeklypatients`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get completeAppointmentGrowth$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshCompleteAppointmentGrowth$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchCompleteAppointmentGrowth()));
  }

  private fetchCompleteAppointmentGrowth(): Observable<AppointmentStatus> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<AppointmentStatus>>(`${environment.schedulerApiUrl}/dashboard/completeappointmentgrowth`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get cancelledAppointmentGrowth$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshCanceledAppointmentGrowth$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchCancelledAppointmentGrowth()));
  }

  private fetchCancelledAppointmentGrowth(): Observable<AppointmentStatus> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<AppointmentStatus>>(`${environment.schedulerApiUrl}/dashboard/cancelledappointmentgrowth`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public get yearlyAppointments$(): Observable<AppointmentStatus> {
    return combineLatest([this.refreshYearlyAppointments$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchYearlyAppointments()));
  }

  private fetchYearlyAppointments(): Observable<AppointmentStatus> {
    this.loaderSvc.activate();
    return this.http.get<BaseResponse<AppointmentStatus>>(`${environment.schedulerApiUrl}/dashboard/yearlyappointments`).pipe(
      map((response) => response.data),
      tap(() => this.loaderSvc.deactivate()),
    );
  }

  public refreshAppointments() {
    this.refreshAppointment$$.next();
  }
}
