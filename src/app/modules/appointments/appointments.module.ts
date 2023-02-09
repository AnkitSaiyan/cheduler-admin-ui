import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { AppointmentsRoutingModule } from './appointments-routing.module';
import { AppointmentsComponent } from './pages/appointments.component';
import { AddAppointmentComponent } from './components/add-appointment/add-appointment.component';
import { SharedModule } from '../../shared/shared.module';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';
import { ViewAppointmentComponent } from './components/view-appointment/view-appointment.component';
import { AppointmentCalendarComponent } from './components/appointment-calendar/appointment-calendar.component';
import { ChangeRadiologistModalComponent } from './components/change-radiologist-modal/change-radiologist-modal.component';
import { AppointmentTimeChangeModalComponent } from './components/appointment-time-change-modal/appointment-time-change-modal.component';

@NgModule({
  declarations: [
    AppointmentsComponent,
    AddAppointmentComponent,
    AppointmentListComponent,
    ViewAppointmentComponent,
    AppointmentCalendarComponent,
    ChangeRadiologistModalComponent,
    AppointmentTimeChangeModalComponent,
  ],
  imports: [CommonModule, AppointmentsRoutingModule, SharedModule, ReactiveFormsModule],
})
export class AppointmentsModule {}
