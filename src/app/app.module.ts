import { ChangeDetectorRef, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { DesignSystemCoreModule, NgDfmNotificationModule } from 'diflexmo-angular-design';
import { APP_BASE_HREF, DatePipe, TitleCasePipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from 'src/environments/environment';
import {
	MSAL_GUARD_CONFIG,
	MSAL_INSTANCE,
	MSAL_INTERCEPTOR_CONFIG,
	MsalBroadcastService,
	MsalGuard,
	MsalGuardConfiguration,
	MsalInterceptor,
	MsalInterceptorConfiguration,
	MsalModule,
	MsalRedirectComponent,
	MsalService,
} from '@azure/msal-angular';
import { BrowserCacheLocation, InteractionType, IPublicClientApplication, LogLevel, PublicClientApplication } from '@azure/msal-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { WeekdayToNamePipe } from './shared/pipes/weekday-to-name.pipe';
import { MonthToNamePipe } from './shared/pipes/month-to-name.pipe';
import { TimeInIntervalPipe } from './shared/pipes/time-in-interval.pipe';
import { NameValuePairPipe } from './shared/pipes/name-value-pair.pipe';
import { HeaderInterceptor } from './core/http/header.interceptor';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AuthConfig, MSALConfig } from './configuration/auth.config';
import { ErrorInterceptor } from './core/http/error.interceptor';
import { RoleNamePipe } from './shared/pipes/role-name.pipe';
import { RouteGuard } from './core/guard/route.guard';
import { PermissionGuard } from './core/guard/permission.guard';
import { TitleStrategy } from '@angular/router';
import { AppTitlePrefix } from './core/services/title.service';
import { UtcToLocalPipe } from './shared/pipes/utc-to-local.pipe';
import {DefaultDatePipe} from "./shared/pipes/default-date.pipe";
import { SharedModule } from './shared/shared.module';
import { JoinWithAndPipe } from './shared/pipes/join-with-and.pipe';

export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http);
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
	const protectedResourceMap = new Map<string, Array<string>>();
	AuthConfig.protectedApis.forEach((protectedApi) => {
		protectedResourceMap.set(protectedApi.url, [protectedApi.scope]);
	});

	return {
		interactionType: InteractionType.Redirect,
		protectedResourceMap,
	};
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
	return {
		interactionType: InteractionType.Redirect,
		authRequest: {
			scopes: [environment.schedulerApiAuthScope],
		},
		loginFailedRoute: '/login-failed',
	};
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
		MsalModule,
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
		// HttpClientInMemoryWebApiModule.forRoot(DataService),
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
		// { provide: APP_BASE_HREF, useValue: '/admin' },
		{ provide: TitleStrategy, useClass: AppTitlePrefix },
		{
			provide: HTTP_INTERCEPTORS,
			useClass: MsalInterceptor,
			multi: true,
		},
		{
			provide: MSAL_INSTANCE,
			useValue: new PublicClientApplication({ ...MSALConfig }),
		},
		{
			provide: MSAL_GUARD_CONFIG,
			useFactory: MSALGuardConfigFactory,
		},
		{
			provide: MSAL_INTERCEPTOR_CONFIG,
			useFactory: MSALInterceptorConfigFactory,
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
		MsalService,
		MsalGuard,
		MsalBroadcastService,
	],
})
export class AppModule {}
