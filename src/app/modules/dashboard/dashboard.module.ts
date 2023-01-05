import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './pages/dashboard.component';
import { AppointmentsListComponent } from './components/appointments-list/appointments-list.component';
import { AppointmentsDoughnutChartComponent } from './components/charts/appointments-doughnut-chart/appointments-doughnut-chart.component';
import { UpcomingAppointmentsComponent } from './components/upcoming-appointments/upcoming-appointments.component';
import { SharedModule } from '../../shared/shared.module';
import { RecentPatientsComponent } from './components/recent-patients/recent-patients.component';
import { PatientConsultationsLineChartComponent } from './components/charts/patient-consultantions-line-chart/patient-consultations-line-chart.component';
import { TopReferringDoctorsListComponent } from './components/top-referring-doctors-list/top-referring-doctors-list.component';
import { DashboardNotificationsComponent } from './components/dashboard-notifications/dashboard-notifications.component';
import { TopExaminationsComponent } from './components/top-examinations/top-examinations.component';
import { UnavailableHallPeriodsComponent } from './components/unavailable-hall-periods/unavailable-hall-periods.component';
import { AppointmentsBarChartComponent } from './components/charts/appointments-bar-chart/appointments-bar-chart.component';
import { PatientsBarChartComponent } from './components/charts/patients-bar-chart/patients-bar-chart.component';
import { CancelledBarChartComponent } from './components/charts/cancelled-bar-chart/cancelled-bar-chart.component';
import { ConsultationsDoughnutChartComponent } from './components/charts/consultations-doughnut-chart/consultations-doughnut-chart.component';
import { EmployeeAbsencesComponent } from './components/employee-absences/employee-absences.component';
import { PostItComponent } from './components/post-it/post-it.component';

@NgModule({
  declarations: [
    DashboardComponent,
    AppointmentsListComponent,
    AppointmentsDoughnutChartComponent,
    UpcomingAppointmentsComponent,
    RecentPatientsComponent,
    PatientConsultationsLineChartComponent,
    TopReferringDoctorsListComponent,
    DashboardNotificationsComponent,
    TopExaminationsComponent,
    UnavailableHallPeriodsComponent,
    AppointmentsBarChartComponent,
    PatientsBarChartComponent,
    CancelledBarChartComponent,
    ConsultationsDoughnutChartComponent,
    EmployeeAbsencesComponent,
    PostItComponent,
  ],
  imports: [CommonModule, DashboardRoutingModule, SharedModule],
})
export class DashboardModule {}
