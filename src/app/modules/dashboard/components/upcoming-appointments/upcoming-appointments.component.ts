import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DfmDatasource } from 'diflexmo-angular-design';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { Appointment } from 'src/app/shared/models/appointment.model';
import { PaginationData } from 'src/app/shared/models/base-response.model';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';

@Component({
	selector: 'dfm-upcoming-appointments',
	templateUrl: './upcoming-appointments.component.html',
	styleUrls: ['./upcoming-appointments.component.scss'],
})
export class UpcomingAppointmentsComponent extends DestroyableComponent implements OnInit, OnDestroy {
	private upcomingAppointments$$: BehaviorSubject<any[]>;

	public filteredUpcommingAppointments$$: BehaviorSubject<any[]>;

	public noDataFound: boolean = false;

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	private paginationData: PaginationData | undefined;

	// public upcomingAppointments: any[] = [
	//   {
	//     name: 'Angela Bower',
	//     time: (new Date()).setHours((new Date()).getHours() + 0.5),
	//     roomNo: 2,
	//     post: 'Pathologist',
	//     avatar: ''
	//   },
	//   {
	//     name: 'Angela Bower',
	//     time: (new Date()).setHours((new Date()).getHours() + 0.5),
	//     roomNo: 4,
	//     post: 'Pathologist',
	//     avatar: ''
	//   },
	//   {
	//     name: 'Murdock',
	//     time: (new Date()).setHours((new Date()).getHours() + 0.5),
	//     roomNo: 3,
	//     post: 'Surgeon',
	//     avatar: ''
	//   },
	//   {
	//     name: 'April Curtis',
	//     time: (new Date()).setHours((new Date()).getHours() + 0.5),
	//     roomNo: 11,
	//     post: 'Cardiologist',
	//     avatar: ''
	//   },
	//   {
	//     name: 'Lorem',
	//     time: (new Date()).setHours((new Date()).getHours() + 0.5),
	//     roomNo: 8,
	//     post: 'Neurologist',
	//     avatar: ''
	//   }
	// ]
	constructor(private appointmentApiService: AppointmentApiService, private router: Router) {
		super();
		this.upcomingAppointments$$ = new BehaviorSubject<any[]>([]);
		this.filteredUpcommingAppointments$$ = new BehaviorSubject<any[]>([]);
	}

	ngOnInit(): void {
		this.filteredUpcommingAppointments$$.pipe(takeUntil(this.destroy$$)).subscribe({
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
			next: (absences) => this.filteredUpcommingAppointments$$.next([...absences]),
		});
		this.appointmentApiService.upcomingAppointment$.pipe(takeUntil(this.destroy$$)).subscribe((appointmentsBase) => {
			if (appointmentsBase.data.length > 0) {
				if (this.paginationData && this.paginationData.pageNo < appointmentsBase.metaData.pagination.pageNo) {
					this.upcomingAppointments$$.next([...this.upcomingAppointments$$.value, ...appointmentsBase.data]);
				} else {
					this.upcomingAppointments$$.next(appointmentsBase.data);
				}
				this.paginationData = appointmentsBase.metaData.pagination;
			} else {
				this.noDataFound = true;
			}
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

	public onScroll(): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.appointmentApiService.pageNo = this.appointmentApiService.pageNo + 1;
		}
	}
}








