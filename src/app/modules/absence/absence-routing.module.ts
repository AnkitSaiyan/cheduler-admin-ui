import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteName, RouteType } from 'src/app/shared/models/permission.model';
import { AbsenceComponent } from './pages/absence.component';
import { AbsenceListComponent } from './components/absence-list/absence-list.component';
import { ABSENCE_ID, ABSENCE_TYPE, ABSENCE_TYPE_ARRAY } from '../../shared/utils/const';
import { ViewAbsenceComponent } from './components/view-absence/view-absence.component';

const absenceRoutes: Routes = [
	{
		path: '',
		component: AbsenceComponent,
		children: [
			{
				path: ABSENCE_TYPE_ARRAY[0],
				component: AbsenceListComponent,
				data: { routeType: RouteType.View, routeName: RouteName.Absence, [ABSENCE_TYPE]: ABSENCE_TYPE_ARRAY[0] },
			},
			{
				path: ABSENCE_TYPE_ARRAY[1],
				component: AbsenceListComponent,
				data: { routeType: RouteType.View, routeName: RouteName.Absence, [ABSENCE_TYPE]: ABSENCE_TYPE_ARRAY[1] },
			},
			{
				path: ABSENCE_TYPE_ARRAY[2],
				component: AbsenceListComponent,
				data: { routeType: RouteType.View, routeName: RouteName.Absence, [ABSENCE_TYPE]: ABSENCE_TYPE_ARRAY[2] },
			},
			{
				path: `${ABSENCE_TYPE_ARRAY[0]}/:${ABSENCE_ID}/view`,
				component: ViewAbsenceComponent,
				data: { routeType: RouteType.View, routeName: RouteName.Absence, [ABSENCE_TYPE]: ABSENCE_TYPE_ARRAY[0] },
			},
			{
				path: `${ABSENCE_TYPE_ARRAY[1]}/:${ABSENCE_ID}/view`,
				component: ViewAbsenceComponent,
				data: { routeType: RouteType.View, routeName: RouteName.Absence, [ABSENCE_TYPE]: ABSENCE_TYPE_ARRAY[1] },
			},
			{
				path: `${ABSENCE_TYPE_ARRAY[2]}/:${ABSENCE_ID}/view`,
				component: ViewAbsenceComponent,
				data: { routeType: RouteType.View, routeName: RouteName.Absence, [ABSENCE_TYPE]: ABSENCE_TYPE_ARRAY[2] },
			},
			{
				path: '**',
				redirectTo: 'rooms',
				pathMatch: 'full',
			},
		],
	},
];

@NgModule({
  imports: [RouterModule.forChild(absenceRoutes)],
  exports: [RouterModule],
})
export class AbsenceRoutingModule {}
