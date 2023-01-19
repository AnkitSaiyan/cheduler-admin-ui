import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentsComponent } from './pages/appointments.component';
import { AddAppointmentComponent } from './components/add-appointment/add-appointment.component';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';
import { APPOINTMENT_ID } from '../../shared/utils/const';
import { ViewAppointmentComponent } from './components/view-appointment/view-appointment.component';

const appointmentRoutes: Routes = [
  {
    path: '',
    component: AppointmentsComponent,
    children: [
      {
        path: '',
        component: AppointmentListComponent,
      },
      {
        path: 'add',
        component: AddAppointmentComponent,
      },
      {
        path: `:${APPOINTMENT_ID}/edit`,
        component: AddAppointmentComponent,
      },
      {
        path: `:${APPOINTMENT_ID}/view`,
        component: ViewAppointmentComponent,
      },
      {
        path: '**',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(appointmentRoutes)],
  exports: [RouterModule],
})
export class AppointmentsRoutingModule {}
