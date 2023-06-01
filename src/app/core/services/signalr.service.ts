import { EventEmitter, Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { IHttpConnectionOptions } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class SignalrService {
	private appointments$$ = new Subject<string>();
	private hubConnection!: signalR.HubConnection;

	constructor() {
		this.createConnection();
		this.register();
		this.startConnection();
	}

	public get appointmentData$(): Observable<any> {
		return this.appointments$$ as Observable<any>;
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

	private register(): void {
		this.hubConnection.on('InformClient', (param: string) => {
			this.appointments$$.next(param);
		});
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
}

