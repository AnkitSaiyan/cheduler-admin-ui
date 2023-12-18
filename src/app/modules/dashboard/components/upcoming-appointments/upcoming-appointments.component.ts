import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DfmDatasource } from 'diflexmo-angular-design';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { UpcomingAppointmentApiService } from 'src/app/core/services/upcoming-appointment-api.service';

@Component({
	selector: 'dfm-upcoming-appointments',
	templateUrl: './upcoming-appointments.component.html',
	styleUrls: ['./upcoming-appointments.component.scss'],
})
export class UpcomingAppointmentsComponent extends DestroyableComponent implements OnInit {
	private upcomingAppointments$$: BehaviorSubject<any[]>;

	public filteredUpcomingAppointments$$: BehaviorSubject<any[]>;

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	public noDataFound: boolean = false;

	constructor(private upcomingAppointmentApiService: UpcomingAppointmentApiService, private router: Router) {
		super();
		this.upcomingAppointments$$ = new BehaviorSubject<any[]>([]);
		this.filteredUpcomingAppointments$$ = new BehaviorSubject<any[]>([]);
	}

	ngOnInit(): void {
		this.filteredUpcomingAppointments$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
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
				this.filteredUpcomingAppointments$$.next([...absences]);
			},
		});

		this.upcomingAppointmentApiService.upcomingAppointmentsIn4Hours$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (appointments) => {
				this.upcomingAppointments$$.next(appointments);
			},
		});
	}

	public navigateToView(appointment: any) {
		if (appointment?.appointmentId) {
			this.router.navigate([`/appointment/${appointment.appointmentId}/view`], { replaceUrl: true });
		}
	}

	redirectToCalender() {
		this.router.navigate(['/', 'appointment']);
	}
}
