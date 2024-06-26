import { DatePipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, debounceTime, map, Observable, of, startWith, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { NameValue } from 'src/app/shared/components/search-modal.component';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { DefaultDatePipe } from 'src/app/shared/pipes/default-date.pipe';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import {
	AddAppointmentRequestData,
	AddOutSideOperatingHoursAppointmentRequest,
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
import { ShareDataService } from './share-data.service';
import { UserManagementApiService } from './user-management-api.service';
import { Document } from 'src/app/shared/models/document.model';

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

	public appointmentListData: NameValue[] = [
		{
			name: 'upcoming',
			value: 'upcoming',
		},
		{
			name: 'past',
			value: 'past',
		},
	];

	private refreshAppointment$$ = new Subject<void>();

	private selectedLang$$ = new BehaviorSubject<string>('');

	private appointmentUrl = `${environment.schedulerApiUrl}/appointment`;

	private pageNo$$ = new BehaviorSubject<number>(1);

	public set pageNo(pageNo: number) {
		this.pageNo$$.next(pageNo);
	}

	public get pageNo(): number {
		return this.pageNo$$.value;
	}

	private appointmentPageNo$$ = new BehaviorSubject<number>(1);

	public set appointmentPageNo(pageNo: number) {
		this.appointmentPageNo$$.next(pageNo);
	}

	public get appointmentPageNo(): number {
		return this.appointmentPageNo$$.value;
	}


	private pastAppointmentPageNo$$ = new BehaviorSubject<number>(1);

	public set pastAppointmentPageNo(pageNo: number) {
		this.pastAppointmentPageNo$$.next(pageNo);
	}

	public get pastAppointmentPageNo(): number {
		return this.pastAppointmentPageNo$$.value;
	}

	private recentPatientPageNo$$ = new BehaviorSubject<number>(1);

	public set recentPatientPageNo(pageNo: number) {
		this.recentPatientPageNo$$.next(pageNo);
	}

	public get recentPatientPageNo(): number {
		return this.recentPatientPageNo$$.value;
	}

	constructor(
		private http: HttpClient,
		private dashboardApiService: DashboardApiService,
		private loaderSvc: LoaderService,
		private shareDataSvc: ShareDataService,
		private userManagementSvc: UserManagementApiService,
		private datePipe: DatePipe,
		private defaultDatePipe: DefaultDatePipe,
		private utcToLocalPipe: UtcToLocalPipe,
	) {
		super();
		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => this.selectedLang$$.next(lang),
			});
	}

	public get appointment$(): Observable<BaseResponse<Appointment[]>> {
		this.loaderSvc.activate();
		return combineLatest([this.appointmentPageNo$$]).pipe(
			switchMap(([pageNo]) => {
				return this.getAppointmentData(pageNo, false);
			}),
		);
	}

	public get pastAppointment$(): Observable<BaseResponse<Appointment[]>> {
		this.loaderSvc.activate();
		return combineLatest([this.pastAppointmentPageNo$$]).pipe(
			switchMap(([pageNo]) => {
				return this.getAppointmentData(pageNo, true);
			}),
		);
	}


	public get appointmentListData$(): Observable<any[]> {
		return combineLatest([this.selectedLang$$.pipe(startWith(''))]).pipe(
			switchMap(([lang]) => {
				return of(this.appointmentListData).pipe(
					map((appointmentListTypeItems) => {
						if (lang) {
							return appointmentListTypeItems.map((appointmentType) => {
								return {
									...appointmentType,
									name: Translate[appointmentType.name][lang],
								};
							});
						}
						return appointmentListTypeItems;
					}),
				);
			}),
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

	private getAppointmentData(pageNo:any, isPast:boolean): Observable<BaseResponse<Appointment[]>> {
		return this.fetchAllAppointments$(pageNo, isPast).pipe(
			switchMap((appointments) =>
				this.AttachPatientDetails(appointments.data).pipe(
					map((data) => {
						this.loaderSvc.deactivate();
						return { ...appointments, data };
					}),
				),
			),
		);
	}

	// Extract the logic for building queryParams
	private buildQueryParams(data: any, isPast: boolean): any {
		const queryParams: any = { pageNo: 1 };

		if (isPast) queryParams.isPast = true;
		if (data.appointmentNumber) queryParams.id = data.appointmentNumber;
		if (data.roomsId) queryParams.roomId = data.roomsId;
		if (data.examList?.length) queryParams.examId = data.examList;
		if (data.doctorId) queryParams.doctorId = data.doctorId;
		if (data.startedAt) queryParams.startDate = data.startedAt;
		if (data.endedAt) queryParams.endDate = data.endedAt;
		if (data.startTime) queryParams.startTime = data.startTime;
		if (data.endTime) queryParams.endTime = data.endTime;
		if (data.FirstName) queryParams.FirstName = data.FirstName;
		if (data.LastName) queryParams.LastName = data.LastName;
		if (data.userId) queryParams.userId = data.userId;
		if (data.approval === 0 || data.approval) queryParams.approval = data.approval;

		return queryParams;
	}

	// Extract the common logic for mapping appointments
	private mapAppointments(response: BaseResponse<Appointment[]>): BaseResponse<Appointment[]> {
		if (!response?.data?.length) {
			return { ...response, data: [] };
		}

		const appointments = response.data;

		if (!appointments?.length) {
			return { ...response, data: [] };
		}

		return { ...response, data: appointments.map((appointment) => this.getAppointmentModified(appointment)) };
	}

	// Use a separate function for fetching appointments
	private fetchAppointments(params: any): Observable<BaseResponse<Appointment[]>> {
		return this.http.get<BaseResponse<Appointment[]>>(`${this.appointmentUrl}`, { params });
	}

	public fetchAllAppointments$(pageNo: number, isPast: boolean, data?: any): Observable<BaseResponse<Appointment[]>> {
		this.loaderSvc.activate();
		if (data) {
			const queryParams = this.buildQueryParams(data, isPast);
			return this.fetchAppointments(queryParams).pipe(
				map((response) => this.mapAppointments(response)),
				tap(() => this.loaderSvc.deactivate()),
			);
		}
		let params = new HttpParams().append('pageNo', pageNo);
		if (isPast) {
			params = params.append('isPast', true);
		}

		return this.fetchAppointments(params).pipe(
			map((response) => this.mapAppointments(response)),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	public changeAppointmentStatus$(requestData: ChangeStatusRequestData[]): Observable<boolean> {
		return this.http.put<BaseResponse<boolean>>(`${this.appointmentUrl}/updateappointmentstatus`, requestData).pipe(
			map((resp) => resp?.data),
			tap(() => this.appointmentPageNo$$.next(1)),
		);
	}

	public deleteAppointment$(appointmentID: number): Observable<boolean> {
		return this.http.delete<BaseResponse<boolean>>(`${this.appointmentUrl}/${appointmentID}`).pipe(
			map((response) => response.data),
			tap(() => {
				this.appointmentPageNo$$.next(1);
				this.dashboardApiService.refreshAppointments();
			}),
		);
	}

	public getAppointmentByID$(appointmentID: number): Observable<Appointment | undefined> {
		this.loaderSvc.activate();
		this.loaderSvc.spinnerActivate();

		return combineLatest([this.appointmentPageNo$$]).pipe(
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
						...this.getAppointmentModified({ ...response?.data, examDetail: response?.data?.examBatchDetail } as any),
						patientFname: userDetail?.givenName,
						patientLname: userDetail?.surname,
						patientTel: userDetail.properties?.extension_PhoneNumber,
						patientEmail: userDetail.email,
					};
				}
				return this.getAppointmentModified({ ...response?.data, examDetail: response?.data?.examBatchDetail } as any);
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

		if (patientTimeZone?.startsWith('+')) {
			patientTimeZone = patientTimeZone.slice(1);
		}

		return this.http.post<BaseResponse<Appointment>>(`${this.appointmentUrl}`, { ...restData, patientTimeZone }).pipe(
			map((response) => response.data),
			tap(() => this.appointmentPageNo$$.next(1)),
		);
	}

	public saveOutSideOperatingHoursAppointment$(
		requestData: AddOutSideOperatingHoursAppointmentRequest,
		action: 'add' | 'update',
	): Observable<Appointment> {
		let patientTimeZone = this.datePipe.transform(new Date(), 'ZZZZZ');

		if (patientTimeZone?.startsWith('+')) {
			patientTimeZone = patientTimeZone.slice(1);
		}

		if (action === 'add') {
			return this.http.post<BaseResponse<Appointment>>(`${this.appointmentUrl}/addappointment`, { ...requestData, patientTimeZone }).pipe(
				map((response) => response.data),
				tap(() => this.appointmentPageNo$$.next(1)),
			);
		}
		const { id, ...restData } = requestData;
		return this.http.put<BaseResponse<Appointment>>(`${this.appointmentUrl}/editappointment/${id}`, { ...restData, patientTimeZone }).pipe(
			map((response) => response.data),
			tap(() => this.appointmentPageNo$$.next(1)),
		);
	}

	public updateAppointment$(requestData: AddAppointmentRequestData): Observable<Appointment> {
		const { id, ...restData } = requestData;
		let patientTimeZone = this.datePipe.transform(new Date(), 'ZZZZZ');

		if (patientTimeZone?.startsWith('+')) {
			patientTimeZone = patientTimeZone.slice(1);
		}

		return this.http.put<BaseResponse<Appointment>>(`${this.appointmentUrl}/${id}`, { ...restData, patientTimeZone }).pipe(
			map((response) => response.data),
			tap(() => this.appointmentPageNo$$.next(1)),
		);
	}

	public updateAppointmentDuration$(requestData: UpdateDurationRequestData): Observable<null> {
		this.loaderSvc.activate();
		return this.http.put<BaseResponse<null>>(`${this.appointmentUrl}/updateappointmentduration`, requestData).pipe(
			map((response) => response?.data),
			tap(() => {
				this.appointmentPageNo$$.next(1);
				this.loaderSvc.deactivate();
			}),
		);
	}

	public getSlots$(requestData: AppointmentSlotsRequestData): Observable<AppointmentSlot[]> {
		const customRequestData = { ...requestData, date: requestData.fromDate };
		delete customRequestData?.fromDate;
		delete customRequestData?.toDate;
		return this.http.post<BaseResponse<AppointmentSlot>>(`${environment.schedulerApiUrl}/appointment/slots`, customRequestData).pipe(
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
			catchError(() => {
				this.loaderSvc.spinnerDeactivate();
				return of([]);
			}),
		);
	}

	public updateRadiologist$(requestData: UpdateRadiologistRequestData): Observable<any> {
		return this.http.put<BaseResponse<any>>(`${this.appointmentUrl}/updateradiologist`, requestData).pipe(
			map((res) => res?.data),
			tap(() => this.appointmentPageNo$$.next(1)),
		);
	}

	public getAppointmentModified(appointment: Appointment): Appointment {
		const examIdToRooms: { [key: number]: Room[] } = {};
		const examIdToUsers: { [key: number]: User[] } = {};
		const roomIdToUsers: { [key: number]: User[] } = {};

		if (appointment?.roomsDetail?.length) {
			appointment?.roomsDetail?.forEach((room) => {
				const examId = +room.examId;
				if (!examIdToRooms[examId]) {
					examIdToRooms[examId] = [];
				}
				examIdToRooms[+room.examId].push(room);
			});
		}

		if (appointment?.examDetail?.length) {
			appointment?.examDetail?.forEach((examDetail) => {
				examDetail?.resourcesBatch?.forEach((batch) => {
					roomIdToUsers[batch?.rooms?.[0]?.id] = batch.users;
					batch?.users?.forEach((user) => {
						if (!examIdToUsers[+examDetail.id]) {
							examIdToUsers[+examDetail.id] = [];
						}
						examIdToUsers[+examDetail.id]?.push(user);
					});
				});
			});
		}

		return this.setModifiedDataInAppointments(appointment, examIdToRooms, roomIdToUsers, examIdToUsers);
	}

	private setModifiedDataInAppointments(
		appointment: Appointment,
		examIdToRooms: { [key: number]: Room[] },
		roomIdToUsers: { [key: number]: User[] },
		examIdToUsers: { [key: number]: User[] },
	): Appointment {
		let startedAt;
		let endedAt;

		const ap = {
			...appointment,
			exams: appointment?.examDetail?.map((exam) => {
				if (exam.startedAt && (!startedAt || new Date(exam.startedAt) < startedAt)) {
					startedAt = new Date(exam.startedAt);
				}

				if (exam.endedAt && (!endedAt || new Date(exam.endedAt) > endedAt)) {
					endedAt = new Date(exam.endedAt);
				}

				return {
					...exam,
					rooms: examIdToRooms[+exam.id]?.map((room) => ({ ...room, users: roomIdToUsers[room.id] })),
					allUsers: exam?.users?.filter((user, index, rest) => rest.findIndex((restUser) => restUser.id === user.id) === index) ?? [],
					users: examIdToUsers[+exam.id]?.filter((user, index, rest) => rest.findIndex((restUser) => restUser.id === user.id) === index),
				};
			}),
		};

		ap.startedAt = startedAt;
		ap.endedAt = endedAt;
		return ap as any;
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

	public get upcomingAppointment$(): Observable<BaseResponse<Appointment[]>> {
		this.loaderSvc.activate();

		return combineLatest([this.pageNo$$]).pipe(
			switchMap(([pageNo]) => {
				const params = new HttpParams().append('pageNo', pageNo);
				return this.http.get<BaseResponse<{ upcomingAppointments: Appointment[] }>>(`${environment.schedulerApiUrl}/dashboard/upcomingappointments`, {
					params,
				});
			}),
			switchMap((response) => {
				const upcoming = response.data?.upcomingAppointments;
				return !upcoming?.length ? of({ ...response, data: [] }) : this.AttachPatientDetails(upcoming).pipe(map((data) => ({ ...response, data })));
			}),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	public get recentPatients$(): Observable<BaseResponse<Appointment[]>> {
		this.loaderSvc.activate();
		return combineLatest([this.recentPatientPageNo$$]).pipe(
			switchMap(([pageNo]) => {
				const params = new HttpParams().append('pageNo', pageNo);
				return this.http.get<BaseResponse<{ appointment: Appointment[] }>>(`${environment.schedulerApiUrl}/dashboard/recentpatients`, { params });
			}),
			switchMap((response) => {
				const recentAppointments = response.data?.appointment;
				return !recentAppointments?.length
					? of({ ...response, data: [] })
					: this.AttachPatientDetails(recentAppointments).pipe(map((data) => ({ ...response, data })));
			}),
		);
	}

	public uploadDocumnet(file: any, uniqueId: string, appointmentId = '0'): Observable<any> {
		const formData = new FormData();
		formData.append('File', file);
		formData.append('ApmtQRCodeId', uniqueId);
		formData.append('FileData', '');
		formData.append('FileName', '');
		formData.append('AppointmentId', appointmentId);
		formData.append('isUploadedFromQr', JSON.stringify(false));
		return this.http.post<any>(`${environment.schedulerApiUrl}/qrcode/upload`, formData).pipe(
			map((response) => response.data),
			tap(),
		);
	}

	public getDocumentById$(id: any, isPreview: boolean): Observable<Document[]> {
		let params = new HttpParams();
		const idType = isNaN(id) ? 'qrCodeId' : 'appointmentId';
		params = params.append(idType, id);
		params = params.append('isPreview', isPreview);
		return this.http.get<any>(`${environment.schedulerApiUrl}/qrcode/getdocuments`, { params }).pipe(
			map((response) => response.data),
			tap(() => {}),
		);
	}

	public deleteDocument(qrId: number | string): Observable<any> {
		return this.http.delete<any>(`${environment.schedulerApiUrl}/qrcode/${qrId}`).pipe(
			map((response) => response.statusCode),
			tap(),
		);
	}

	public refresh(): void {
		this.refreshAppointment$$.next();
	}

	public convertUtcToLocalDate(date: string | Date): string {
		return date ? this.defaultDatePipe.transform(this.utcToLocalPipe.transform(date.toString())) : '-';
	}

	public appointmentForCalendar$(fromDate: string, toDate: string): Observable<BaseResponse<Appointment[]>> {
		return combineLatest([this.appointmentPageNo$$.pipe(startWith(''))]).pipe(
			debounceTime(100),
			switchMap(() => this.getAppointmentForCalendar(fromDate, toDate)),
		);
	}

	private getAppointmentForCalendar(fromDate: string, toDate: string): Observable<BaseResponse<Appointment[]>> {
		this.loaderSvc.activate();
		const params = { toDate, fromDate };
		return this.http.get<BaseResponse<Appointment[]>>(`${this.appointmentUrl}/appointmentlist`, { params }).pipe(
			map((response) => this.mapAppointments(response)),
			tap(() => this.loaderSvc.deactivate()),
		);
	}
}
