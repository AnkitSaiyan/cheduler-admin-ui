import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, interval, map, startWith, switchMap, take } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { Appointment } from 'src/app/shared/models/appointment.model';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { AppointmentApiService } from './appointment-api.service';

@Injectable({
	providedIn: 'root',
})
export class UpcomingAppointmentApiService {
	private todaysAppointments$$ = new BehaviorSubject<Appointment[]>([]);

	private refreshUpcomingAppointments$$ = new Subject<void>();

	private timer$: Subscription;

	constructor(private http: HttpClient, private utcPipe: UtcToLocalPipe, private appointmentApiService: AppointmentApiService) {
		this.upcomingAppointments$.pipe(take(1)).subscribe({
			next: (res) => this.todaysAppointments$$.next(res),
		});

		this.timer$ = interval(1000 * 60).subscribe({
			next: () => this.refreshUpcomingAppointments$$.next(),
		});
	}

	private get upcomingAppointments$(): Observable<Appointment[]> {
		return this.http
			.get<BaseResponse<{ upcomingAppointments: Appointment[] }>>(`${environment.schedulerApiUrl}/dashboard/upcomingappointments`)
			.pipe(map((res) => res?.data?.upcomingAppointments ?? []));
	}

	private filterAppointmentsIn4HourRange(appointments: Appointment[]): Appointment[] {
		return appointments?.filter((ap) => {
			const startedAt = ap?.exam?.startedAt ? ap.exam.startedAt : ap.startedAt;

			const dateIn4Hours = new Date();
			dateIn4Hours.setHours(new Date().getHours() + 4);

			return dateIn4Hours.getTime() - new Date(this.utcPipe.transform(startedAt)).getTime() >= 0;
		});
	}

	public get upcomingAppointmentsIn4Hours$(): Observable<any> {
		return combineLatest([this.todaysAppointments$$, this.refreshUpcomingAppointments$$.pipe(startWith(''))]).pipe(
			map(([appointments]) => this.filterAppointmentsIn4HourRange(appointments)),
			switchMap((appointments) => this.appointmentApiService.AttachPatientDetails(appointments)),
		);
	}

	public get todaysAppointments$(): Observable<Appointment[]> {
		return this.todaysAppointments$$.asObservable();
	}

	public set todaysAppointments(appointments: Appointment[]) {
		this.todaysAppointments$$.next(appointments);
	}

	public endTimer() {
		// this.timer$.unsubscribe();
		// this.refreshUpcomingAppointments$$.complete();
		// this.todaysAppointments$$.unsubscribe();
	}
}
