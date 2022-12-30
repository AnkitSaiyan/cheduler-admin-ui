import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { AppointmentsListComponent } from './appointments-list/appointments-list.component';
import { AppointmentsDoughnutChartComponent } from './charts/appointments-doughnut-chart/appointments-doughnut-chart.component';
import { UpcomingAppointmentsComponent } from './upcoming-appointments/upcoming-appointments.component';
import { SharedModule } from '../shared/shared.module';
import { RecentPatientsComponent } from './recent-patients/recent-patients.component';
import { PatientConsultationsLineChartComponent } from './charts/patient-consultantions-line-chart/patient-consultations-line-chart.component';
import { TopReferringDoctorsListComponent } from './top-referring-doctors-list/top-referring-doctors-list.component';
import { DashboardNotificationsComponent } from './dashboard-notifications/dashboard-notifications.component';
import { TopExaminationsComponent } from './top-examinations/top-examinations.component';
import { UnavailableHallPeriodsComponent } from './unavailable-hall-periods/unavailable-hall-periods.component';
import { AppointmentsBarChartComponent } from './charts/appointments-bar-chart/appointments-bar-chart.component';
import { PatientsBarChartComponent } from './charts/patients-bar-chart/patients-bar-chart.component';
import { CancelledBarChartComponent } from './charts/cancelled-bar-chart/cancelled-bar-chart.component';
import { ConsultationsDoughnutChartComponent } from './charts/consultations-doughnut-chart/consultations-doughnut-chart.component';
import { EmployeeAbsencesComponent } from './employee-absences/employee-absences.component';
import { PostItComponent } from './post-it/post-it.component';

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
