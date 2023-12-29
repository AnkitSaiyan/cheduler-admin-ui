import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteName, RouteType } from 'src/app/shared/models/permission.model';
import { PracticeHoursComponent } from './pages/practice-hours.component';

const practiceHoursRoutes: Routes = [
	{
		path: '',
		component: PracticeHoursComponent,
		data: { routeType: RouteType.View, routeName: RouteName.Practice },
	},
];

@NgModule({
	imports: [RouterModule.forChild(practiceHoursRoutes)],
	exports: [RouterModule],
})
export class PracticeHoursRoutingModule {}
