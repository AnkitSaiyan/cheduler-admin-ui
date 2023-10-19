import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DfmDatasource } from 'diflexmo-angular-design';
import { BehaviorSubject, filter, takeUntil } from 'rxjs';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { SignalrService } from 'src/app/core/services/signalr.service';
import { UpcomingAppointmentApiService } from 'src/app/core/services/upcoming-appointment-api.service';

@Component({
	selector: 'dfm-upcoming-appointments',
	templateUrl: './upcoming-appointments.component.html',
	styleUrls: ['./upcoming-appointments.component.scss'],
})
export class UpcomingAppointmentsComponent extends DestroyableComponent implements OnInit, OnDestroy {
	private upcomingAppointments$$: BehaviorSubject<any[]>;

	public filteredUpcomingAppointments$$: BehaviorSubject<any[]>;

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public noDataFound: boolean = false;

	// private paginationData: PaginationData | undefined;

	constructor(
		// private appointmentApiService: AppointmentApiService,
		private upcomingAppointmentApiService: UpcomingAppointmentApiService,
		private router: Router,
		private signalRService: SignalrService,
	) {
		super();
		this.upcomingAppointments$$ = new BehaviorSubject<any[]>([]);
		this.filteredUpcomingAppointments$$ = new BehaviorSubject<any[]>([]);
		// this.appointmentApiService.pageNo = 1;
	}

	ngOnInit(): void {
		this.filteredUpcomingAppointments$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				if(!items.length)return
				console.log("items", items);
				this.tableData$$.next({
					items,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.upcomingAppointments$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (absences) => {
				console.log([...absences]);
				this.filteredUpcomingAppointments$$.next([...absences])
			},
		});

		this.upcomingAppointmentApiService.upcomingAppointmentsIn4Hours$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (appointments) => {	
				if (appointments.length) {
					this.upcomingAppointments$$.next(appointments);
				}
			},
		});

		this.signalRService.latestUpcomingAppointments$
			.pipe(
				filter((res) => !!res),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (list) => {
					console.log(list);
				},
			});
	}

	public override ngOnDestroy() {
		this.upcomingAppointmentApiService.endTimer();
	}

	public navigateToView(appointment: any) {
		if (appointment?.appointmentId) {
			this.router.navigate([`/appointment/${appointment.appointmentId}/view`], { replaceUrl: true });
		}
	}

	redirectToCalender() {
		this.router.navigate(['/', 'appointment']);
	}

	public sortAppointment([...appointment]: any): Array<any> {
		return appointment.sort((a: any, b: any) => (new Date(b.startedAt) ? -1 : new Date(a.startedAt) ? 1 : 0));
	}
}
