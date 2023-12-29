import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteName, RouteType } from 'src/app/shared/models/permission.model';
import { StaffComponent } from './pages/staff.component';
import { StaffListComponent } from './components/staff-list/staff-list.component';
import { STAFF_ID } from '../../shared/utils/const';
import { StaffViewComponent } from './components/staff-view/staff-view.component';
import { AddStaffComponent } from './components/add-staff/add-staff.component';

const staffRoutes: Routes = [
	{
		path: '',
		component: StaffComponent,
		title: 'Staff',
		children: [
			{
				path: '',
				component: StaffListComponent,
				data: { routeType: RouteType.View, routeName: RouteName.Staffs },
			},
			{
				path: 'add',
				component: AddStaffComponent,
				data: { routeType: RouteType.Add, routeName: RouteName.Staffs },
			},
			{
				path: `:${STAFF_ID}/view`,
				component: StaffViewComponent,
				data: { routeType: RouteType.View, routeName: RouteName.Staffs },
			},
			{
				path: `:${STAFF_ID}/edit`,
				component: AddStaffComponent,
				data: { routeType: RouteType.Add, routeName: RouteName.Staffs },
			},
		],
	},
];

@NgModule({
	imports: [RouterModule.forChild(staffRoutes)],
	exports: [RouterModule],
})
export class StaffRoutingModule {}
