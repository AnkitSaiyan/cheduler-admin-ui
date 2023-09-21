import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { IHttpConnectionOptions } from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject, of, switchMap } from 'rxjs';
import { AppointmentApiService } from './appointment-api.service';
import { NotificationDataService } from './notification-data.service';
import { Translate } from 'src/app/shared/models/translate.model';
import { ShareDataService } from './share-data.service';
import { environment } from '../../../environments/environment';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
	providedIn: 'root',
})
export class SignalrService {
	private appointmentsModuleData$$ = new Subject<string>();

	private priorityModuleData$$ = new Subject<string>();

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

	private createConnection() {
		const SubDomain: string = window.location.host.split('.')[0];
		const options: IHttpConnectionOptions = {
			headers: { SubDomain },
		};

		this.hubConnection = new signalR.HubConnectionBuilder()
			.withUrl(`${environment.schedulerApiUrl.slice(0, -3)}informhub`, options)
			.configureLogging(signalR.LogLevel.Debug)
			.build();
	}

	private startConnection(): void {
		this.hubConnection
			.start()
			.then(() => {
				console.log('Connection started.');
				if (this.hubConnection.connectionId) this.sendConnectionId(this.hubConnection.connectionId);
			})
			.catch((err) => {
				console.log('Opps!');
			});
	}

	private registerForAppointmentModule(): void {
		this.hubConnection.on('InformClient', (param: any) => {
			this.appointmentsModuleData$$.next(param);
			this.notificationSvc.showSuccess(
				`${
					param.action == 'Add'
						? Translate.AppointmentRecived[this.selectedLang]
						: Translate.AppointmentNo[this.selectedLang] +
						  ' ' +
						  param.id +
						  ' ' +
						  `${
								param.action == 'Delete'
									? Translate.Delete[this.selectedLang]
									: param.action == 'Approved'
									? Translate.AppointmentStatus.Approved[this.selectedLang]
									: param.action == 'Cancelled'
									? Translate.AppointmentStatus.Cancelled[this.selectedLang]
									: Translate.SuccessMessage.Update[this.selectedLang]
						  }`
				}!`,
			);
		});
	}

	private registerForPriorityModule(): void {
		this.hubConnection.on('UpdatePriorityPercentage', (param: string) => {
			this.priorityModuleData$$.next(param);
		});
	}

	private sendConnectionId(connectionId: string) {
		this.http
			.post<BaseResponse<any>>(`${environment.schedulerApiUrl}/signalr?connectionId=${connectionId}`, null)
			.subscribe((res) => console.log('Data send successfully'));
	}
}

