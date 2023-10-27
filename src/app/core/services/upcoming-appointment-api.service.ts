import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, interval, map, startWith, takeUntil } from 'rxjs';
import { Appointment } from 'src/app/shared/models/appointment.model';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

interface UpcomingAppointments {
	startedAt: string | Date;
	patientFullName: string;
	examName: string;
	roomName: string;
}

@Injectable({
	providedIn: 'root',
})
export class UpcomingAppointmentApiService extends DestroyableComponent {
	private todaysAppointments$$ = new BehaviorSubject<any[]>([]);

	private refreshUpcomingAppointments$$ = new Subject<void>();

	private timer$: Subscription;

	public upComingAppointments = new BehaviorSubject<Appointment[]>([]);

	constructor(private utcPipe: UtcToLocalPipe) {
		super();

		this.timer$ = interval(1000 * 60).subscribe({
			next: () => this.refreshUpcomingAppointments$$.next(),
		});

		this.upComingAppointments.pipe(takeUntil(this.destroy$$)).subscribe((data) => {
			if (data?.length) {
				const arr = data.map((val) => this.getSaperatedExamData(val)).flat();				
				this.todaysAppointments$$.next(arr);
			}
		});
	}

	public get upcomingAppointmentsIn4Hours$(): Observable<any> {
		return combineLatest([this.todaysAppointments$$, this.refreshUpcomingAppointments$$.pipe(startWith(''))]).pipe(
			map(([appointments]) => this.filterAppointmentsIn4HourRange(appointments)),
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

	private getSaperatedExamData(appointment: Appointment): UpcomingAppointments[] {
		if (!appointment) return [];
		let examsArr: any[] = [];
		appointment?.exams?.forEach((exam) => {
			let obj: UpcomingAppointments = {
				startedAt: '',
				patientFullName: '',
				examName: '',
				roomName: '',
			};

			obj.patientFullName = appointment.patientFname + ' ' + appointment.patientLname;
			obj.startedAt = exam.startedAt;
			obj.examName = exam.name;
			obj.roomName = exam?.rooms?.[0].name ?? '';
			examsArr.push(obj);
		});

		return examsArr;
	}

	private filterAppointmentsIn4HourRange(appointments: Appointment[]): Appointment[] {
		return appointments?.filter((ap) => {
			const dateIn4Hours = new Date();
			dateIn4Hours.setHours(new Date().getHours() + 4);
			return dateIn4Hours.getTime() - new Date(this.utcPipe.transform(ap.startedAt)).getTime() >= - (60 * 1000);
		});
	}
}
