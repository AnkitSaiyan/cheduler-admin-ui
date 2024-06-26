import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, startWith, Subject, switchMap, tap, takeUntil, of } from 'rxjs';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { Appointment } from 'src/app/shared/models/appointment.model';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { Exam } from 'src/app/shared/models/exam.model';
import { Physician } from 'src/app/shared/models/physician.model';
import { Room } from 'src/app/shared/models/rooms.model';
import { AppointmentStatus } from 'src/app/shared/models/status.model';
import { AppointmentChartDataType } from 'src/app/shared/models/dashboard.model';
import { environment } from '../../../environments/environment';
import { LoaderService } from './loader.service';
import { ShareDataService } from './share-data.service';
import { Notification } from '../../shared/models/notification.model';
import { UserManagementApiService } from './user-management-api.service';
import { SchedulerUser } from '../../shared/models/user.model';

export interface PostIt {
	id: number;
	message: string;
	createdAt: Date;
}

@Injectable({
	providedIn: 'root',
})
export class DashboardApiService extends DestroyableComponent {
	constructor(
		private shareDataSvc: ShareDataService,
		private http: HttpClient,
		private loaderSvc: LoaderService,
		private userManagementApiSvc: UserManagementApiService,
	) {
		super();
		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => this.selectedLang$$.next(lang),
			});
	}

	private refreshAppointment$$ = new Subject<void>();

	private refreshNotification$$ = new Subject<void>();

	private refreshClearNotification$$ = new Subject<void>();

	private refreshRoomAbsence$$ = new Subject<void>();

	private refreshPost$$ = new Subject<void>();

	private refreshClearPost$$ = new Subject<void>();

	private refreshAppointmentChart$$ = new Subject<void>();

	private refreshAppointmentBarChart$$ = new Subject<void>();

	private refreshPatientBarChart$$ = new Subject<void>();

	private refreshCompletedBarChart$$ = new Subject<void>();

	private refreshCancelledBarChart$$ = new Subject<void>();

	private refreshOverallLineChart$$ = new Subject<void>();

	private refreshDoctors$$ = new Subject<void>();

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

	public clearNotificationData$$ = new BehaviorSubject<any>([]);

	public clearPostItData$$ = new BehaviorSubject<any>([]);

	private selectedLang$$ = new BehaviorSubject<string>('');

	private notificationPageNo$$ = new BehaviorSubject<number>(1);

	public set notificationPageNo(pageNo: number) {
		this.notificationPageNo$$.next(pageNo);
	}

	public get notificationPageNo(): number {
		return this.notificationPageNo$$.value;
	}

	private roomAbsencePageNo$$ = new BehaviorSubject<number>(1);

	public set roomAbsencePageNo(pageNo: number) {
		this.roomAbsencePageNo$$.next(pageNo);
	}

	public get roomAbsencePageNo(): number {
		return this.roomAbsencePageNo$$.value;
	}

	public get appointment$(): Observable<Appointment[]> {
		return combineLatest([this.refreshAppointment$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllAppointments()));
	}

	private fetchAllAppointments(): Observable<Appointment[]> {
		this.loaderSvc.activate();
		return this.http.get<BaseResponse<Appointment[]>>(`${environment.schedulerApiUrl}/appointment`).pipe(
			map((response) => response.data),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	public get notification$(): Observable<BaseResponse<Notification[]>> {
		return combineLatest([this.notificationPageNo$$, this.refreshNotification$$.pipe(startWith(''))]).pipe(
			switchMap(([pageNo]) => this.fetchAllNotifications(pageNo)),
		);
	}

	private fetchAllNotifications(pageNo: number): Observable<BaseResponse<Notification[]>> {
		this.loaderSvc.activate();
		const params = new HttpParams().append('pageNo', pageNo);
		return this.http.get<BaseResponse<{ notifications: Notification[] }>>(`${environment.schedulerApiUrl}/dashboard/notifications`, { params }).pipe(
			switchMap((response) => {
				const notifications = response?.data?.notifications;

				if (!notifications?.length) {
					return of({ ...response, data: [] });
				}

				const patientIds = new Set<string>();
				notifications.forEach((n) => {
					if (n.patientAzureId && !patientIds.has(n.patientAzureId)) {
						patientIds.add(n.patientAzureId);
					}
				});

				if (!patientIds.size) {
					return of({ ...response, data: notifications });
				}

				return this.userManagementApiSvc.getPatientByIds$([...patientIds]).pipe(
					map((users) => {
						const userIdToDetailsMap = new Map<string, SchedulerUser>();

						users.forEach((u) => userIdToDetailsMap.set(u.id, u));
						return notifications.map((n) => ({
							...n,
							...(n?.patientAzureId
								? { title: `${userIdToDetailsMap.get(n.patientAzureId)?.givenName} ${userIdToDetailsMap.get(n.patientAzureId)?.surname}` }
								: {}),
						}));
					}),
					map((data) => ({ ...response, data })),
				) as Observable<BaseResponse<Notification[]>>;
			}),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	public get clearNotification$(): Observable<Notification[]> {
		return combineLatest([this.refreshClearNotification$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllClearNotifications()));
	}

	private fetchAllClearNotifications(): Observable<Notification[]> {
		this.loaderSvc.activate();
		return this.http.get<BaseResponse<Notification[]>>(`${environment.schedulerApiUrl}/dashboard/clearnotificationslist`).pipe(
			map((response: any) => response.data?.notifications),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	public get roomAbsence$(): Observable<BaseResponse<Room[]>> {
		return combineLatest([this.roomAbsencePageNo$$, this.refreshRoomAbsence$$.pipe(startWith(''))]).pipe(
			switchMap(([pageNo]) => this.fetchRoomAbsence(pageNo)),
		);
	}

	private fetchRoomAbsence(pageNo: number): Observable<BaseResponse<Room[]>> {
		this.loaderSvc.activate();
		const params = new HttpParams().append('pageNo', pageNo);
		return this.http.get<BaseResponse<{ roomAbsence: Room[] }>>(`${environment.schedulerApiUrl}/dashboard/roomabsences`, { params }).pipe(
			map((response) => ({ ...response, data: response.data?.roomAbsence })),
			tap(() => this.loaderSvc.deactivate()),
		);
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

	public get clearPosts$(): Observable<PostIt[]> {
		return combineLatest([this.refreshClearPost$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchClearPosts()));
	}

	private fetchClearPosts(): Observable<PostIt[]> {
		this.loaderSvc.activate();
		return this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/dashboard/clearpostits`).pipe(
			map((response: any) => response.data?.postIts),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	public get appointmentDoughnutChartData$$(): Observable<AppointmentChartDataType[]> {
		return combineLatest([this.refreshAppointmentChart$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAppointmentDoughnutChartData$()));
	}

	private fetchAppointmentDoughnutChartData$(): Observable<AppointmentChartDataType[]> {
		this.loaderSvc.activate();
		return this.http
			.get<BaseResponse<{ appointments: AppointmentChartDataType[] }>>(`${environment.schedulerApiUrl}/dashboard/appointmentsstatus`)
			.pipe(
				map((response) => response?.data?.appointments ?? []),
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
		return combineLatest([
			this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/dashboard/weeklycompletedappointments`),
			this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/dashboard/completeappointmentgrowth`),
		]).pipe(
			map(([res1, res2]) => ({ ...res1.data, ...res2.data })),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	public get cancelledBarChart$(): Observable<any> {
		return combineLatest([this.refreshCancelledBarChart$$.pipe(startWith(''))]).pipe(switchMap(() => this.cancelledBarChart()));
	}

	private cancelledBarChart(): Observable<any> {
		this.loaderSvc.activate();
		return combineLatest([
			this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/dashboard/weeklycancelledappointments`),
			this.http.get<BaseResponse<PostIt[]>>(`${environment.schedulerApiUrl}/dashboard/cancelledappointmentgrowth`),
		]).pipe(
			map(([res1, res2]) => ({ ...res1.data, ...res2.data })),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	public get yearlyAppointmentsChartData$(): Observable<AppointmentChartDataType[]> {
		return combineLatest([this.refreshOverallLineChart$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchYearlyAppointmentsChartData$()));
	}

	private fetchYearlyAppointmentsChartData$(): Observable<AppointmentChartDataType[]> {
		return this.http
			.get<BaseResponse<{ yearlyappointments: AppointmentChartDataType[] }>>(`${environment.schedulerApiUrl}/dashboard/yearlyappointments`)
			.pipe(map((response) => response?.data?.yearlyappointments ?? []));
	}

	addPost(message: string): Observable<PostIt> {
		this.loaderSvc.activate();
		return this.http.post<BaseResponse<PostIt>>(`${environment.schedulerApiUrl}/postit`, { message }).pipe(
			map((response) => response.data),
			tap(() => {
				this.refreshPost$$.next();
				this.refreshClearPost$$.next();
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
				this.refreshClearPost$$.next();
				this.loaderSvc.deactivate();
			}),
		);
	}

	clearNotification(ids: number[]): Observable<PostIt> {
		this.loaderSvc.activate();
		return this.http
			.post<BaseResponse<PostIt>>(`${environment.schedulerApiUrl}/dashboard/clearnotifications`, {
				objectType: 'appointment',
				objectId: ids,
			})
			.pipe(
				map((response) => response.data),
				tap(() => {
					this.refreshClearNotification$$.next();
					this.loaderSvc.deactivate();
				}),
			);
	}

	clearPost(ids: number[]): Observable<PostIt> {
		this.loaderSvc.activate();
		return this.http
			.post<BaseResponse<PostIt>>(`${environment.schedulerApiUrl}/dashboard/clearnotifications`, {
				objectType: 'post_its',
				objectId: ids,
			})
			.pipe(
				map((response) => response.data),
				tap(() => {
					this.refreshClearPost$$.next();
					this.loaderSvc.deactivate();
				}),
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

	public refreshCharts() {
		this.refreshAppointmentChart$$.next();
		this.refreshNotification$$.next();
		this.refreshAppointmentBarChart$$.next();
		this.refreshPatientBarChart$$.next();
		this.refreshCompletedBarChart$$.next();
		this.refreshCancelledBarChart$$.next();
	}
}
