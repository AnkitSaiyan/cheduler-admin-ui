import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrowserUtils } from '@azure/msal-browser';
import { MsalGuard } from '@azure/msal-angular';
import { CompleteProfileComponent } from './shared/components/complete-profile/complete-profile.component';
import { RouteGuard } from './core/guard/route.guard';
import { LoginFailedComponent } from './shared/components/login-failed/login-failed.component';

const rootRoutes: Routes = [
	{
		path: 'complete-profile',
		title: 'Cheduler - Complete Profile',
		component: CompleteProfileComponent,
		canActivate: [MsalGuard, RouteGuard],
	},
	{
		path: '',
		loadChildren: async () => (await import('./core/core.module')).CoreModule,
		canActivate: [MsalGuard, RouteGuard],
	},
	{
		path: '',
		title: 'Login Failed',
		component: LoginFailedComponent,
	},
];

@NgModule({
	imports: [
		RouterModule.forRoot(rootRoutes, {
			initialNavigation: !BrowserUtils.isInIframe() && !BrowserUtils.isInPopup() ? 'enabledNonBlocking' : 'disabled', // Set to enabledBlocking to use Angular Universal
		}),
	],
	exports: [RouterModule],
})
export class AppRoutingModule {}
