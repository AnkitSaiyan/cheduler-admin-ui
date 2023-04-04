import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteName, RouteType } from 'src/app/shared/models/permission.model';
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
        data: { routeType: RouteType.View, routeName: RouteName.Appointment },
      },
      {
        path: 'add',
        component: AddAppointmentComponent,
        data: { routeType: RouteType.Add, routeName: RouteName.Appointment },
      },
      {
        path: `:${APPOINTMENT_ID}/edit`,
        component: AddAppointmentComponent,
        data: { routeType: RouteType.Add, routeName: RouteName.Appointment },
      },
      {
        path: `:${APPOINTMENT_ID}/view`,
        component: ViewAppointmentComponent,
        data: { routeType: RouteType.View, routeName: RouteName.Appointment },
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
