import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { AppointmentsRoutingModule } from './appointments-routing.module';
import { AppointmentsComponent } from './pages/appointments.component';
import { AddAppointmentComponent } from './components/add-appointment/add-appointment.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [AppointmentsComponent, AddAppointmentComponent],
  imports: [CommonModule, AppointmentsRoutingModule, SharedModule, ReactiveFormsModule],
})
export class AppointmentsModule {}
