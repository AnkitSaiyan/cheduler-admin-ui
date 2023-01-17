import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppointmentsRoutingModule } from './appointments-routing.module';
import { AppointmentsComponent } from './pages/appointments.component';
import { AddAppointmentComponent } from './components/add-appointment/add-appointment.component';


@NgModule({
  declarations: [
    AppointmentsComponent,
    AddAppointmentComponent
  ],
  imports: [
    CommonModule,
    AppointmentsRoutingModule
  ]
})
export class AppointmentsModule { }
