import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, interval, map, startWith, switchMap, take, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { Appointment } from 'src/app/shared/models/appointment.model';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { AppointmentApiService } from './appointment-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { DateTimeUtils } from 'src/app/shared/utils/date-time.utils';

@Injectable({
	providedIn: 'root',
})
export class UpcomingAppointmentApiService extends DestroyableComponent {
	private todaysAppointments$$ = new BehaviorSubject<any[]>([]);

	private refreshUpcomingAppointments$$ = new Subject<void>();

	private timer$: Subscription;

	public upComingAppointments = new BehaviorSubject<Appointment[]>([]);

	constructor(private http: HttpClient, private utcPipe: UtcToLocalPipe, private appointmentApiService: AppointmentApiService) {
		super();
		// this.upcomingAppointments$.pipe(takeUntil(this.destroy$$)).subscribe({
		// 	next: (res) =>
		// 		this.todaysAppointments$$.next(res),
		// });

		this.timer$ = interval(1000 * 60).subscribe({
			next: () => this.refreshUpcomingAppointments$$.next(),
		});

		this.upComingAppointments.subscribe((data) => {
			if (data?.length) {
				const arr = data.map((val) => this.getSaperatedExamData(val)).flat()
				// 	data.map((val) => this.getSaperatedExamData(val)).flat()this.filterAppointments().map((app) => {
				// 	return {
				// 		startedAt: app.startedAt,
				// 		patientFullName: app.patientFullName,
				// 		examName: app.examName,
				// 		roomName: app.roomName,
				// 	};
				// });
				// console.log(arr);
				this.todaysAppointments$$.next(arr);
			}
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
			// console.log(dateIn4Hours.getTime() - new Date(this.utcPipe.transform(startedAt)).getTime() >= 0)
			return dateIn4Hours.getTime() - new Date(this.utcPipe.transform(startedAt)).getTime() >= 0;
		});
	}

	public get upcomingAppointmentsIn4Hours$(): Observable<any> {
		return combineLatest([this.todaysAppointments$$, this.refreshUpcomingAppointments$$.pipe(startWith(''))]).pipe(
			map(([appointments]) => this.filterAppointments(appointments)),
			// switchMap((appointments) => this.appointmentApiService.AttachPatientDetails(appointments)),
			// switchMap((appointments) => (appointments)),
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

	private getSaperatedExamData(appointment: any): any[] {
		if (!appointment) return [];
		let examsArr: any[] = [];
		appointment?.exams.forEach((exam) => {
			let obj = {
				startedAt: '',
				patientFullName: '',
				examName: '',
				roomName: '',
			};

			obj.patientFullName = appointment.patientFname + ' ' + appointment.patientLname;
			(obj.startedAt = exam.startedAt), (obj.examName = exam.name);
			obj.roomName = exam.rooms[0].name;
			examsArr.push(obj);
		});

		return examsArr;
	}

	private filterAppointments(appointments: any[]): any[] {
		return appointments?.filter((ap) => {
			const startedAt = ap?.exam?.startedAt ? ap.exam.startedAt : ap.startedAt;
			const dateIn4Hours = new Date();
			dateIn4Hours.setHours(new Date().getHours() + 4);
			return dateIn4Hours.getTime() - new Date(this.utcPipe.transform(startedAt)).getTime() >= 0;
		});
	}
}
