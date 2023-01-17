import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentsComponent } from './pages/appointments.component';
import { AddAppointmentComponent } from './components/add-appointment/add-appointment.component';

const appointmentRoutes: Routes = [
  {
    path: '',
    component: AppointmentsComponent,
    children: [
      {
        path: 'add',
        component: AddAppointmentComponent,
      },
      {
        path: '',
        redirectTo: 'add',
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
