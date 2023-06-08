import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { IHttpConnectionOptions } from '@microsoft/signalr';
import { Observable, Subject, switchMap } from 'rxjs';
import { AppointmentApiService } from './appointment-api.service';
import { NotificationDataService } from './notification-data.service';
import { Translate } from 'src/app/shared/models/translate.model';
import { ShareDataService } from './share-data.service';

@Injectable({
	providedIn: 'root',
})
export class SignalrService {
	private appointmentsModuleData$$ = new Subject<string>();

	private priorityModuleData$$ = new Subject<string>();

	private hubConnection!: signalR.HubConnection;

	private selectedLang!: string;

	constructor(
		private appointmentApiSvc : AppointmentApiService,
		private notificationSvc : NotificationDataService,
		private shareDataSvc : ShareDataService,
	) {
		this.createConnection();
		this.registerForAppointmentModule();
		this.registerForPriorityModule();
		this.startConnection();

		this.shareDataSvc.getLanguage$().subscribe({
        next: (lang) => this.selectedLang = lang
      });
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
		this.hubConnection.on('InformClient', (param: any) => {
			this.appointmentsModuleData$$.next(param);
			this.notificationSvc.showSuccess(`${param.action == 'Add' ? Translate.SuccessMessage.AppointmentAdded[this.selectedLang] : param.action == 'Delete' ? Translate.DeleteAppointment[this.selectedLang] :  Translate.SuccessMessage.AppointmentUpdate[this.selectedLang]}!`);
		});
	}

	private registerForPriorityModule(): void {
		this.hubConnection.on('UpdatePriorityPercentage', (param: string) => {
			this.priorityModuleData$$.next(param);
		});
	}
}

