import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { DesignSystemCoreModule } from 'diflexmo-angular-design';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// eslint-disable-next-line import/no-extraneous-dependencies
// import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { environment } from 'src/environments/environment';
import {
  MsalBroadcastService,
  MsalGuard,
  MsalGuardConfiguration,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalModule,
  MsalRedirectComponent,
  MsalService,
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
} from '@azure/msal-angular';
import { BrowserCacheLocation, InteractionType, IPublicClientApplication, LogLevel, PublicClientApplication } from '@azure/msal-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { WeekdayToNamePipe } from './shared/pipes/weekday-to-name.pipe';
import { MonthToNamePipe } from './shared/pipes/month-to-name.pipe';
import { TimeInIntervalPipe } from './shared/pipes/time-in-interval.pipe';
import { NameValuePairPipe } from './shared/pipes/name-value-pair.pipe';
import { HeaderInterceptor } from './core/http/header.interceptor';
// eslint-disable-next-line import/order
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
// eslint-disable-next-line import/order
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// @ts-ignore
import { AuthConfig } from './configuration/auth.config';
import {ErrorInterceptor} from "./core/http/error.interceptor";
// eslint-disable-next-line import/no-extraneous-dependencies
// import { DataService } from './core/services/data.service';

// export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
//   return new TranslateHttpLoader(http);
// }
const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1; // Remove this line to use Angular Universal

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

export function loggerCallback(logLevel: LogLevel, message: string) {
  console.log(logLevel, message);
}

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.authClientId,
      authority: `${AuthConfig.fullAuthority}/${AuthConfig.authFlow}`,
      redirectUri: '/',
      postLogoutRedirectUri: '/',
      knownAuthorities: [AuthConfig.authority],
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: isIE,
    },
    system: {
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Trace,
        piiLoggingEnabled: true,
      },
    },
  });
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
    loginFailedRoute: '/',
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
    // TranslateModule.forRoot({
    //   defaultLanguage: 'en-BE',
    //   loader: {
    //     provide: TranslateLoader,
    //     useFactory: HttpLoaderFactory,
    //     deps: [HttpClient],
    //   },
    // }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HeaderInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory,
    },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ],
})
export class AppModule {}
