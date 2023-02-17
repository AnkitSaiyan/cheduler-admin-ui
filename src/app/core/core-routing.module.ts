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
        loadChildren: async () => (await import('../modules/dashboard/dashboard.module')).DashboardModule,
      },
      {
        path: 'staff',
        loadChildren: async () => (await import('../modules/staff/staff.module')).StaffModule,
      },
      {
        path: 'room',
        loadChildren: async () => (await import('../modules/rooms/rooms.module')).RoomsModule,
      },
      {
        path: 'physician',
        loadChildren: async () => (await import('../modules/physician/physician.module')).PhysicianModule,
      },
      {
        path: 'site-management',
        loadChildren: async () => (await import('../modules/site-management/site-management.module')).SiteManagementModule,
      },
      {
        path: 'practice-hours',
        loadChildren: async () => (await import('../modules/practice-hours/practice-hours.module')).PracticeHoursModule,
      },
      {
        path: 'user',
        loadChildren: async () => (await import('../modules/user/user.module')).UserModule,
      },
      {
        path: 'exam',
        loadChildren: async () => (await import('../modules/exam/exam.module')).ExamModule,
      },
      {
        path: 'absence',
        loadChildren: async () => (await import('../modules/absence/absence.module')).AbsenceModule,
      },
      {
        path: 'appointment',
        loadChildren: async () => (await import('../modules/appointments/appointments.module')).AppointmentsModule,
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
