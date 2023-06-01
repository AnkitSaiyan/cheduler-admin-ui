import { EventEmitter, Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class SignalrService {
	appointments$$ = new Subject<string>();
	private hubConnection!: signalR.HubConnection;

	constructor() {
		this.createConnection();
		this.register();
		this.startConnection();
	}

	private createConnection() {
		this.hubConnection = new signalR.HubConnectionBuilder()
			.withUrl('https://diflexmo-scheduler-api-dev.azurewebsites.net/informhub')
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

