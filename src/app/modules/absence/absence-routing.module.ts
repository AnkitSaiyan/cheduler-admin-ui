import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteName, RouteType } from 'src/app/shared/models/permission.model';
import { AbsenceComponent } from './pages/absence.component';
import { AbsenceListComponent } from './components/absence-list/absence-list.component';
import { ABSENCE_ID, ABSENCE_TYPE } from '../../shared/utils/const';
import { ViewAbsenceComponent } from './components/view-absence/view-absence.component';

const absenceRoutes: Routes = [
	{
		path: '',
		component: AbsenceComponent,
		children: [
			{
				path: `:${ABSENCE_TYPE}`,
				component: AbsenceListComponent,
				data: { routeType: RouteType.View, routeName: RouteName.Absence },
			},
			{
				path: `:${ABSENCE_TYPE}/:${ABSENCE_ID}/view`,
				component: ViewAbsenceComponent,
				data: { routeType: RouteType.View, routeName: RouteName.Absence },
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
