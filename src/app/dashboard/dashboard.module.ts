import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { AppointmentsListComponent } from './appointments-list/appointments-list.component';
import { AppointmentsChartComponent } from './appointments-chart/appointments-chart.component';
import { UpcomingAppointmentsComponent } from './upcoming-appointments/upcoming-appointments.component';
import {SharedModule} from "../shared/shared.module";


@NgModule({
  declarations: [
    DashboardComponent,
    AppointmentsListComponent,
    AppointmentsChartComponent,
    UpcomingAppointmentsComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule
  ]
})
export class DashboardModule { }
