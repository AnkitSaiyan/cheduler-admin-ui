import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { DesignSystemCoreModule, NgDfmNotificationModule } from 'diflexmo-angular-design';
import { APP_BASE_HREF, DatePipe, TitleCasePipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from 'src/environments/environment';
import { MsalGuard, MsalInterceptor, MsalModule, MsalRedirectComponent } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TitleStrategy } from '@angular/router';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { WeekdayToNamePipe } from './shared/pipes/weekday-to-name.pipe';
import { MonthToNamePipe } from './shared/pipes/month-to-name.pipe';
import { TimeInIntervalPipe } from './shared/pipes/time-in-interval.pipe';
import { NameValuePairPipe } from './shared/pipes/name-value-pair.pipe';
import { HeaderInterceptor } from './core/http/header.interceptor';
import { AuthConfig, MSALConfig } from './configuration/auth.config';
import { ErrorInterceptor } from './core/http/error.interceptor';
import { RoleNamePipe } from './shared/pipes/role-name.pipe';
import { RouteGuard } from './core/guard/route.guard';
import { PermissionGuard } from './core/guard/permission.guard';
import { AppTitlePrefix } from './core/services/title.service';
import { UtcToLocalPipe } from './shared/pipes/utc-to-local.pipe';
import { DefaultDatePipe } from './shared/pipes/default-date.pipe';
import { SharedModule } from './shared/shared.module';
import { JoinWithAndPipe } from './shared/pipes/join-with-and.pipe';
import { GlobalErrorHandlerService } from './core/services/global-error-handler.service';

export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http);
}

@NgModule({
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		ReactiveFormsModule,
		FormsModule,
		AppRoutingModule,
		HttpClientModule,
		DesignSystemCoreModule,
		BrowserAnimationsModule,
		MsalModule.forRoot(
			new PublicClientApplication(MSALConfig),
			{
				// The routing guard configuration.
				interactionType: InteractionType.Redirect,
				authRequest: {
					scopes: [environment.schedulerApiAuthScope],
				},
			},
			{
				// MSAL interceptor configuration.
				// The protected resource mapping maps your web API with the corresponding app scopes. If your code needs to call another web API, add the URI mapping here.
				interactionType: InteractionType.Redirect,
				protectedResourceMap: new Map(AuthConfig.protectedApis.map((apis) => [apis.url, [apis.scope]])),
			},
		),
		FormsModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient],
			},
		}),
		NgDfmNotificationModule,
		SharedModule.forRoot(),
	],
	bootstrap: [AppComponent, MsalRedirectComponent],
	providers: [
		WeekdayToNamePipe,
		MonthToNamePipe,
		DatePipe,
		TimeInIntervalPipe,
		NameValuePairPipe,
		TitleCasePipe,
		RoleNamePipe,
		RouteGuard,
		PermissionGuard,
		TranslatePipe,
		UtcToLocalPipe,
		DefaultDatePipe,
		JoinWithAndPipe,
		{ provide: APP_BASE_HREF, useValue: '/admin' },
		{ provide: TitleStrategy, useClass: AppTitlePrefix },
		{
			provide: HTTP_INTERCEPTORS,
			useClass: MsalInterceptor,
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: HeaderInterceptor,
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: ErrorInterceptor,
			multi: true,
		},
		{ provide: ErrorHandler, useClass: GlobalErrorHandlerService },
		MsalGuard,
	],
})
export class AppModule {}
