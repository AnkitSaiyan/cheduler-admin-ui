import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { NameValue } from 'src/app/shared/components/search-modal.component';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import {
	AddAppointmentRequestData,
	Appointment,
	AppointmentSlot,
	AppointmentSlotsRequestData,
	UpdateDurationRequestData,
	UpdateRadiologistRequestData,
} from '../../shared/models/appointment.model';
import { Room } from '../../shared/models/rooms.model';
import { ChangeStatusRequestData } from '../../shared/models/status.model';
import { Translate } from '../../shared/models/translate.model';
import { SchedulerUser, User } from '../../shared/models/user.model';
import { DashboardApiService } from './dashboard-api.service';
import { LoaderService } from './loader.service';
import { PhysicianApiService } from './physician.api.service';
import { ShareDataService } from './share-data.service';
import { UserManagementApiService } from './user-management-api.service';

@Injectable({
	providedIn: 'root',
})
export class AppointmentApiService extends DestroyableComponent {
	public calendarViewType: NameValue[] = [
		{
			name: 'Day',
			value: 'day',
		},
		{
			name: 'Week',
			value: 'week',
		},
		{
			name: 'Month',
			value: 'month',
		},
	];

	private refreshAppointment$$ = new Subject<void>();

	private selectedLang$$ = new BehaviorSubject<string>('');

	private appointmentUrl = `${environment.schedulerApiUrl}/appointment`;

	constructor(
		private physicianApiSvc: PhysicianApiService,
		private http: HttpClient,
		private dashboardApiService: DashboardApiService,
		private loaderSvc: LoaderService,
		private shareDataSvc: ShareDataService,
		private userManagementSvc: UserManagementApiService,
		private datePipe: DatePipe,
	) {
		super();
		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => this.selectedLang$$.next(lang),
			});
	}

	public get appointment$(): Observable<Appointment[]> {
		return combineLatest([this.refreshAppointment$$.pipe(startWith(''))]).pipe(
			switchMap(() => {
				return this.fetchAllAppointments$().pipe(switchMap((appointments) => this.AttachPatientDetails(appointments)));
			}),
			tap((res) =>
		);
	}

	public get fileTypes$(): Observable<any[]> {
		return combineLatest([this.selectedLang$$.pipe(startWith(''))]).pipe(
			switchMap(([lang]) => {
				return of(this.calendarViewType).pipe(
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

	public fetchAllAppointments$(data?: any): Observable<Appointment[]> {
		this.loaderSvc.activate();

		if (data) {
			const queryParams = {};
			if (data?.appointmentNumber) queryParams['id'] = data.appointmentNumber;
			if (data?.roomsId) queryParams['roomId'] = data.roomsId;
			// if (data?.roomsId) queryParams['roomId'] = data.roomsId;
			if (data?.examList) queryParams['examId'] = data.examList;
			if (data?.doctorId) queryParams['doctorId'] = data.doctorId;
			if (data?.startedAt) queryParams['startDate'] = data.startedAt;
			if (data?.endedAt) queryParams['endDate'] = data.endedAt;
			// if (data?.patient) queryParams['endDate'] = data.endedAt;
			if (data?.FirstName) queryParams['FirstName'] = data.FirstName;
			if (data?.LastName) queryParams['LastName'] = data.LastName;
			if (data?.userId) queryParams['userId'] = data.userId;

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
				tap(() => {
					this.loaderSvc.deactivate();
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
			tap(() => {
				this.loaderSvc.deactivate();
			}),
		);
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
		this.loaderSvc.activate();
		this.loaderSvc.spinnerActivate();

		return combineLatest([this.refreshAppointment$$.pipe(startWith(''))]).pipe(
			switchMap(() => this.http.get<BaseResponse<Appointment>>(`${this.appointmentUrl}/${appointmentID}`)),
			switchMap((response) =>
				combineLatest([
					of(response),
					response?.data?.patientAzureId ? (this.userManagementSvc.getUserProperties(response?.data?.patientAzureId) as Observable<any>) : of(null),
				]),
			),
			map(([response, userDetail]) => {
				if (!response?.data) {
					return {} as Appointment;
				}
				if (userDetail) {
					return {
						...this.getAppointmentModified(response.data),
						patientFname: userDetail?.givenName,
						patientLname: userDetail?.surname,
						patientTel: userDetail.properties?.['extension_PhoneNumber'],
						patientEmail: userDetail.email,
					};
				}
				return this.getAppointmentModified(response.data);
			}),
			tap(() => {
				this.loaderSvc.deactivate();
				this.loaderSvc.spinnerDeactivate();
			}),
		);
	}

	public saveAppointment$(requestData: AddAppointmentRequestData): Observable<Appointment> {
		const { id, ...restData } = requestData;
		let patientTimeZone = this.datePipe.transform(new Date(), 'ZZZZZ');

		if (patientTimeZone && patientTimeZone[0] === '+') {
			patientTimeZone = patientTimeZone.slice(1);
		}

		return this.http.post<BaseResponse<Appointment>>(`${this.appointmentUrl}`, { ...restData, patientTimeZone }).pipe(
			map((response) => response.data),
			tap(() => this.refreshAppointment$$.next()),
		);
	}

	public updateAppointment$(requestData: AddAppointmentRequestData): Observable<Appointment> {
		const { id, ...restData } = requestData;
		let patientTimeZone = this.datePipe.transform(new Date(), 'ZZZZZ');

		if (patientTimeZone && patientTimeZone[0] === '+') {
			patientTimeZone = patientTimeZone.slice(1);
		}

		return this.http.put<BaseResponse<Appointment>>(`${this.appointmentUrl}/${id}`, { ...restData, patientTimeZone }).pipe(
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
		const customRequestData = { ...requestData, date: requestData.fromDate };
		delete customRequestData?.fromDate;
		delete customRequestData?.toDate;
		// this.loaderSvc.spinnerActivate();
		return this.http.post<BaseResponse<AppointmentSlot>>(`${environment.schedulerApiUrl}/appointment/slots`, customRequestData).pipe(
			tap((res) =>
			map((res) => [
				{
					...res?.data,
					slots: res?.data?.slots?.length
						? res?.data?.slots.map((slot) => ({
								...slot,
								exams: slot.exams.map((exam: any) => ({
									...exam,
									userId: exam.users,
									roomId: exam.rooms.map((room) => room.roomId),
								})),
						  }))
						: [],
				},
			]),
			tap(() => this.loaderSvc.spinnerDeactivate()),
			catchError((e) => {
				this.loaderSvc.spinnerDeactivate();
				return of([]);
			}),
		);
	}

	public updateRadiologist$(requestData: UpdateRadiologistRequestData): Observable<any> {
		return this.http.put<BaseResponse<any>>(`${this.appointmentUrl}/updateradiologist`, requestData).pipe(
			map((res) => res?.data),
			tap(() => this.refreshAppointment$$.next()),
		);
	}

	private getAppointmentModified(appointment: Appointment): Appointment {
		const examIdToRooms: { [key: number]: Room[] } = {};
		const examIdToUsers: { [key: number]: User[] } = {};

		// const examIdToStartEndTime: {
		// 	[key: number]: {
		// 		startedAt: Date;
		// 		endedAt: Date;
		// 	}
		// }

		if (appointment.roomsDetail?.length) {
			appointment?.roomsDetail?.forEach((room) => {
				const examId = +room.examId;
				if (!examIdToRooms[examId]) {
					examIdToRooms[examId] = [];
					// if (!examIdToStartEndTime[examId]) {
					// 	examIdToStartEndTime[examId] = {
					// 		startedAt: new Date(room.startedAt as string),
					// 		endedAt: new Date(room.startedAt as string),
					// 	}
					// } else {
					// 	const startedAt = new Date(room.startedAt as string)
					// 	const endedAt = new Date()
					// 	if (new Date(room.startedAt as string).getTime() < examIdToStartEndTime[examId].startedAt.getTime()) {
					//
					// 	}
					// }
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
					allUsers: exam?.users?.filter((user, index, rest) => rest.findIndex((restUser) => restUser.id === user.id) === index) ?? [],
					users: examIdToUsers[+exam.id]?.filter((user, index, rest) => rest.findIndex((restUser) => restUser.id === user.id) === index),
				};
			}),
		};

		ap.startedAt = startedAt;
		ap.endedAt = endedAt;

		return ap;
	}

	public AttachPatientDetails(appointments: Appointment[]): Observable<Appointment[]> {
		const patientIds = new Set<string>();

		appointments.forEach((ap) => {
			if (ap.patientAzureId && !patientIds.has(ap.patientAzureId)) {
				patientIds.add(ap.patientAzureId);
			}
		});

		if (!patientIds.size) {
			return of(appointments);
		}

		return this.userManagementSvc.getPatientByIds$([...patientIds]).pipe(
			map((patients) => {
				const patientIdsToDetailsMap = new Map<string, SchedulerUser>();

				patients.forEach((p) => patientIdsToDetailsMap.set(p.id, p));

				return appointments.map((a) => {
					if (!a.patientAzureId) {
						return a;
					}

					return {
						...a,
						patientFname: patientIdsToDetailsMap.get(a.patientAzureId)?.givenName ?? '',
						patientLname: patientIdsToDetailsMap.get(a.patientAzureId)?.surname ?? '',
						patientEmail: patientIdsToDetailsMap.get(a.patientAzureId)?.email ?? '',
					};
				});
			}),
		);
	}

	public get upcomingAppointment$(): Observable<Appointment[]> {
		this.loaderSvc.activate();

		return this.http.get<BaseResponse<{ upcomingAppointments: Appointment[] }>>(`${environment.schedulerApiUrl}/dashboard/upcomingappointments`).pipe(
			switchMap((response) => {
				const upcoming = response.data?.upcomingAppointments;
				return !upcoming || !upcoming.length ? of([]) : this.AttachPatientDetails(upcoming);
			}),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	public get recentPatients$(): Observable<Appointment[]> {
		this.loaderSvc.activate();
		return this.http.get<BaseResponse<{ appointment: Appointment[] }>>(`${environment.schedulerApiUrl}/dashboard/recentpatients`).pipe(
			switchMap((response) => {
				const recentAppointments = response.data?.appointment;
				return !recentAppointments || !recentAppointments.length ? of([]) : this.AttachPatientDetails(recentAppointments);
			}),
		);
	}

	public refresh(): void {
		this.refreshAppointment$$.next();
	}
}
