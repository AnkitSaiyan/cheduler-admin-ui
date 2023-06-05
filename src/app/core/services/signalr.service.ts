import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { IHttpConnectionOptions } from '@microsoft/signalr';
import { Observable, Subject, switchMap } from 'rxjs';
import { AppointmentApiService } from './appointment-api.service';

@Injectable({
	providedIn: 'root',
})
export class SignalrService {
	private appointmentsModuleData$$ = new Subject<string>();
	private priorityModuleData$$ = new Subject<string>();

	private hubConnection!: signalR.HubConnection;

	constructor(
		private appointmentApiSvc : AppointmentApiService
	) {
		this.createConnection();
		this.registerForAppointmentModule();
		this.registerForPriorityModule();
		this.startConnection();
	}

	public get latestAppointmentInfo$(): Observable<any> {
		return this.appointmentsModuleData$$.asObservable().pipe(switchMap((val:any) =>
			this.appointmentApiSvc.AttachPatientDetails([this.appointmentApiSvc.getAppointmentModified(val)])
		));
	}

	public get priorityModuleData$(): Observable<any> {
		return this.priorityModuleData$$.asObservable();
	}

	private createConnection() {
		const SubDomain: string = window.location.host.split('.')[0];
		const options: IHttpConnectionOptions = {
			headers: { SubDomain },
		}

		this.hubConnection = new signalR.HubConnectionBuilder()
			.withUrl(`https://diflexmo-scheduler-api-dev.azurewebsites.net/informhub`, options  )
			.configureLogging(signalR.LogLevel.Debug)
			.build();
	}

	private startConnection(): void {
		this.hubConnection
		.start()
		.then(() => {
			console.log('Connection started.');
		})
		.catch((err) => {
			console.log('Opps!');
		});
	}

	private registerForAppointmentModule(): void {
		this.hubConnection.on('InformClient', (param: string) => {
			this.appointmentsModuleData$$.next(param);
		});
	}

	private registerForPriorityModule(): void {
		this.hubConnection.on('UpdatePriorityPercentage', (param: string) => {
			console.log('priority',param);
			this.priorityModuleData$$.next(param)
		});
	}
}

