import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CoreComponent} from './core.component';
import {PermissionGuard} from './guard/permission.guard';

const routes: Routes = [
	{
		path: '',
		component: CoreComponent,
		children: [
			{
				path: 'dashboard',
				title: 'Cheduler - Dashboard',
				loadChildren: async () => (await import('../modules/dashboard/dashboard.module')).DashboardModule,
			},
			{
				path: 'staff',
				title: 'Cheduler - Staff',
				loadChildren: async () => (await import('../modules/staff/staff.module')).StaffModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'room',
				title: 'Cheduler - Room',
				loadChildren: async () => (await import('../modules/rooms/rooms.module')).RoomsModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'physician',
				title: 'Cheduler - Physician',
				loadChildren: async () => (await import('../modules/physician/physician.module')).PhysicianModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'site-management',
				title: 'Cheduler - Site Management',
				loadChildren: async () => (await import('../modules/site-management/site-management.module')).SiteManagementModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'practice-hours',
				title: 'Cheduler - Practice Hours',
				loadChildren: async () => (await import('../modules/practice-hours/practice-hours.module')).PracticeHoursModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'user',
				title: 'Cheduler - User',
				loadChildren: async () => (await import('../modules/user/user.module')).UserModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'exam',
				title: 'Cheduler - Exam',
				loadChildren: async () => (await import('../modules/exam/exam.module')).ExamModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'absence',
				title: 'Cheduler - Absence',
				loadChildren: async () => (await import('../modules/absence/absence.module')).AbsenceModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'appointment',
				title: 'Cheduler - Appointment',
				loadChildren: async () => (await import('../modules/appointments/appointments.module')).AppointmentsModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'email-template',
				title: 'Cheduler - Email Template',
				loadChildren: async () => (await import('../modules/email-template/email-template.module')).EmailTemplateModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'priority-slots',
				title: 'Cheduler - Priority Slots',
				loadChildren: async () => (await import('../modules/priority-slots/priority-slots.module')).PrioritySlotsModule,
				canActivateChild: [PermissionGuard],
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
export class CoreRoutingModule {
}
