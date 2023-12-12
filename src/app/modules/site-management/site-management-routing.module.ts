import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteName, RouteType } from 'src/app/shared/models/permission.model';
import { SiteManagementComponent } from './pages/site-management.component';

const siteManagementRoutes: Routes = [
	{
		path: '',
		component: SiteManagementComponent,
		data: { routeType: RouteType.View, routeName: RouteName.SiteSetting },
	},
];

@NgModule({
	imports: [RouterModule.forChild(siteManagementRoutes)],
	exports: [RouterModule],
})
export class SiteManagementRoutingModule {}
