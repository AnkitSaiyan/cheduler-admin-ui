import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DfmDatasource } from 'diflexmo-angular-design';
import { BehaviorSubject, filter, takeUntil, withLatestFrom } from 'rxjs';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { PaginationData } from 'src/app/shared/models/base-response.model';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { SignalrService } from 'src/app/core/services/signalr.service';
import { UpcomingAppointmentApiService } from 'src/app/core/services/upcoming-appointment-api.service';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';
import { Appointment } from 'src/app/core/models/appointment.model';

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
				this.tableData$$.next({
					items,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.upcomingAppointments$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (absences) => this.filteredUpcomingAppointments$$.next([...absences]),
		});

		this.upcomingAppointmentApiService.upcomingAppointmentsIn4Hours$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (appointments) => {
				this.upcomingAppointments$$.next(appointments);
			},
		});

		// this.appointmentApiService.upcomingAppointment$.pipe(takeUntil(this.destroy$$)).subscribe({
		// 	next: (appointmentsBase) => {
		// 		if (appointmentsBase.data.length > 0) {
		// 			if (this.paginationData && this.paginationData.pageNo < appointmentsBase?.metaData?.pagination.pageNo) {
		// 				this.upcomingAppointments$$.next([...this.upcomingAppointments$$.value, ...appointmentsBase.data]);
		// 			} else {
		// 				this.upcomingAppointments$$.next(appointmentsBase.data);
		// 			}
		// 			this.paginationData = appointmentsBase?.metaData?.pagination || 1;
		// 		} else {
		// 			this.noDataFound = true;
		// 		}
		// 	},
		// });

		this.signalRService.latestUpcomingAppointments$
			.pipe(
				filter((res) => !!res),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (list) => {
					console.log(list);
					if(list?.length)
					this.upcomingAppointmentApiService.todaysAppointments = list;
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

	public onScroll(): void {
		// if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
		// 	this.appointmentApiService.pageNo = this.appointmentApiService.pageNo + 1;
		// }
	}

	public sortAppointment([...appointment]: any): Array<any> {
		return appointment.sort((a: any, b: any) => (new Date(b.startedAt) ? -1 : new Date(a.startedAt) ? 1 : 0));
	}
}
