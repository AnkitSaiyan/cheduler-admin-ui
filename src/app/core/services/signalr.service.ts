import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { IHttpConnectionOptions } from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject, switchMap } from 'rxjs';
import { Translate } from 'src/app/shared/models/translate.model';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { HttpClient } from '@angular/common/http';
import { Appointment } from 'src/app/shared/models/appointment.model';
import { AppointmentApiService } from './appointment-api.service';
import { NotificationDataService } from './notification-data.service';
import { ShareDataService } from './share-data.service';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class SignalrService {
	private appointmentsModuleData$$ = new Subject<string>();

	private priorityModuleData$$ = new Subject<string>();

	private upcomingAppointments$$ = new BehaviorSubject<Appointment[]>([]);

	private hubConnection!: signalR.HubConnection;

	private selectedLang!: string;

	constructor(
		private appointmentApiSvc: AppointmentApiService,
		private notificationSvc: NotificationDataService,
		private shareDataSvc: ShareDataService,
		private http: HttpClient,
	) {
		this.createConnection();
		this.registerForAppointmentModule();
		this.registerForPriorityModule();
		this.registerUpcomingAppointments();
		this.startConnection();

		this.shareDataSvc.getLanguage$().subscribe({
			next: (lang) => (this.selectedLang = lang),
		});
	}

	public get latestAppointmentInfo$(): Observable<any> {
		return this.appointmentsModuleData$$
			.asObservable()
			.pipe(switchMap((val: any) => this.appointmentApiSvc.AttachPatientDetails([this.appointmentApiSvc.getAppointmentModified(val)])));
	}

	public get priorityModuleData$(): Observable<any> {
		return this.priorityModuleData$$.asObservable();
	}

	public get latestUpcomingAppointments$(): Observable<Appointment[]> {
		return this.upcomingAppointments$$.asObservable();
	}

	private createConnection() {
		const SubDomain: string = window.location.host.split('.')[0];
		const options: IHttpConnectionOptions = {
			headers: { SubDomain },
		};

		this.hubConnection = new signalR.HubConnectionBuilder()
			.withUrl(`${environment.schedulerApiUrl.slice(0, -3)}informhub`, options)
			// .configureLogging(signalR.LogLevel.Debug)
			.build();
	}

	private startConnection(): void {
		this.hubConnection
			.start()
			.then(() => {
				console.clear();
				if (this.hubConnection.connectionId) this.sendConnectionId(this.hubConnection.connectionId);
			})
			.catch(() => {
				console.log('Opps!');
			});
	}

	private registerForAppointmentModule(): void {
		this.hubConnection.on('InformClient', (param: any) => {
			param.examDetail = param.exams;
			param.exams = null;
			this.appointmentsModuleData$$.next(param);

			let message = '';

			switch (param.action) {
				case 'Delete':
					message = Translate.Delete[this.selectedLang];
					break;
				case 'Approved':
					message = Translate.AppointmentStatus.Approved[this.selectedLang];
					break;
				case 'Cancelled':
					message = Translate.AppointmentStatus.Cancelled[this.selectedLang];
					break;
				default:
					message = Translate.SuccessMessage.Update[this.selectedLang];
			}

			this.notificationSvc.showSuccess(
				`${
					param.action === 'Add'
						? Translate.AppointmentRecived[this.selectedLang]
						: `${Translate.AppointmentNo[this.selectedLang]} ${param.id} ${message}`
				}!`,
			);
		});
	}

	private registerForPriorityModule(): void {
		this.hubConnection.on('UpdatePriorityPercentage', (param: string) => {
			this.priorityModuleData$$.next(param);
		});
	}

	private registerUpcomingAppointments(): void {
		this.hubConnection.on('UpcomingAppointments', (param: any) => {
			this.upcomingAppointments$$.next(param);
		});
	}

	private sendConnectionId(connectionId: string) {
		this.http
			.post<BaseResponse<any>>(`${environment.schedulerApiUrl}/signalr?connectionId=${connectionId}`, null)
			.subscribe();
		}
}
