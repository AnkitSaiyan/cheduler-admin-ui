import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CoreComponent } from './core.component';

const routes: Routes = [
  {
    path: '',
    component: CoreComponent,
    children: [
      {
        path: 'dashboard',
        title: 'Diflexmo - Dashboard',
        loadChildren: async () => (await import('../modules/dashboard/dashboard.module')).DashboardModule,
      },
      {
        path: 'staff',
        title: 'Diflexmo - Staff',
        loadChildren: async () => (await import('../modules/staff/staff.module')).StaffModule,
      },
      {
        path: 'room',
        title: 'Diflexmo - Room',
        loadChildren: async () => (await import('../modules/rooms/rooms.module')).RoomsModule,
      },
      {
        path: 'physician',
        title: 'Diflexmo - Physician',
        loadChildren: async () => (await import('../modules/physician/physician.module')).PhysicianModule,
      },
      {
        path: 'site-management',
        title: 'Diflexmo - Site Management',
        loadChildren: async () => (await import('../modules/site-management/site-management.module')).SiteManagementModule,
      },
      {
        path: 'practice-hours',
        title: 'Diflexmo - Practice Hours',
        loadChildren: async () => (await import('../modules/practice-hours/practice-hours.module')).PracticeHoursModule,
      },
      {
        path: 'user',
        title: 'Diflexmo - User',
        loadChildren: async () => (await import('../modules/user/user.module')).UserModule,
      },
      {
        path: 'exam',
        title: 'Diflexmo - Exam',
        loadChildren: async () => (await import('../modules/exam/exam.module')).ExamModule,
      },
      {
        path: 'absence',
        title: 'Diflexmo - Absence',
        loadChildren: async () => (await import('../modules/absence/absence.module')).AbsenceModule,
      },
      {
        path: 'appointment',
        title: 'Diflexmo - Appointment',
        loadChildren: async () => (await import('../modules/appointments/appointments.module')).AppointmentsModule,
      },
      {
        path: 'email',
        loadChildren: async () => (await import('../modules/email/email.module')).EmailModule,
      },
      {
        path: 'priority-slots',
        loadChildren: async () => (await import('../modules/priority-slots/priority-slots.module')).PrioritySlotsModule,
      },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CoreRoutingModule {}
