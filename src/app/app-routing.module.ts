import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { CompleteProfileComponent } from './shared/components/complete-profile/complete-profile.component';
import { RouteGuard } from './core/guard/route.guard';
import { LoginFailedComponent } from './shared/components/login-failed/login-failed.component';

const rootRoutes: Routes = [
	{
		path: 'complete-profile',
		title: 'CompleteProfile',
		component: CompleteProfileComponent,
		canActivate: [MsalGuard, RouteGuard],
	},
	{
		path: '',
		loadChildren: async () => (await import('./core/core.module')).CoreModule,
		canActivate: [MsalGuard],
	},
	{
		path: '',
		title: 'LoginFailed',
		component: LoginFailedComponent,
	},
];

@NgModule({
	imports: [
		RouterModule.forRoot(rootRoutes, {
			initialNavigation: 'enabledBlocking'
		}),
	],
	exports: [RouterModule],
})
export class AppRoutingModule {}
