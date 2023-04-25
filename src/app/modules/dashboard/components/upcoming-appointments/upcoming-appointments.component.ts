import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import {AppointmentApiService} from "../../../../core/services/appointment-api.service";

@Component({
  selector: 'dfm-upcoming-appointments',
  templateUrl: './upcoming-appointments.component.html',
  styleUrls: ['./upcoming-appointments.component.scss'],
})
export class UpcomingAppointmentsComponent extends DestroyableComponent implements OnInit, OnDestroy {
  private upcomingAppointments$$: BehaviorSubject<any[]>;

  public filteredUpcommingAppointments$$: BehaviorSubject<any[]>;

  public noDataFound: boolean = false;

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
    this.appointmentApiService.upcomingAppointment$.pipe(takeUntil(this.destroy$$)).subscribe((appointments) => {
      if (appointments.length > 0) {
        this.upcomingAppointments$$.next(appointments);
        this.filteredUpcommingAppointments$$.next(appointments);
        this.noDataFound = false;
      } else {
        this.noDataFound = true;
      }
    });
  }

  redirectToCalender() {
    this.router.navigate(['/', 'appointment']);
  }
}
