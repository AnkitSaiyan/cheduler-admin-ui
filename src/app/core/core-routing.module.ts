import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CoreComponent } from './core.component';
import { PermissionGuard } from './guard/permission.guard';

const routes: Routes = [
	{
		path: '',
		component: CoreComponent,
		// canActivateChild: [RouteGuard],
		children: [
			{
				path: 'dashboard',
				title: 'Dashboard',
				loadChildren: async () => (await import('../modules/dashboard/dashboard.module')).DashboardModule,
			},
			{
				path: 'staff',
				title: 'Staff',
				loadChildren: async () => (await import('../modules/staff/staff.module')).StaffModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'room',
				title: 'Room',
				loadChildren: async () => (await import('../modules/rooms/rooms.module')).RoomsModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'physician',
				title: 'Physician',
				loadChildren: async () => (await import('../modules/physician/physician.module')).PhysicianModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'site-management',
				title: 'SiteManagement',
				loadChildren: async () => (await import('../modules/site-management/site-management.module')).SiteManagementModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'practice-hours',
				title: 'PracticeHours',
				loadChildren: async () => (await import('../modules/practice-hours/practice-hours.module')).PracticeHoursModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'user',
				title: 'User',
				loadChildren: async () => (await import('../modules/user/user.module')).UserModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'exam',
				title: 'Exam',
				loadChildren: async () => (await import('../modules/exam/exam.module')).ExamModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'absence',
				title: 'Absence',
				loadChildren: async () => (await import('../modules/absence/absence.module')).AbsenceModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'appointment',
				title: 'Appointment',
				loadChildren: async () => (await import('../modules/appointments/appointments.module')).AppointmentsModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'email-template',
				title: 'EmailTemplate',
				loadChildren: async () => (await import('../modules/email-template/email-template.module')).EmailTemplateModule,
				canActivateChild: [PermissionGuard],
			},
			{
				path: 'priority-slots',
				title: 'PrioritySlots',
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
export class CoreRoutingModule {}
