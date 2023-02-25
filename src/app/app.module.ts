import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { DesignSystemCoreModule } from 'diflexmo-angular-design';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// eslint-disable-next-line import/no-extraneous-dependencies
// import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
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
// eslint-disable-next-line import/no-extraneous-dependencies
// import { DataService } from './core/services/data.service';

// export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
//   return new TranslateHttpLoader(http);
// }
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
  bootstrap: [AppComponent],
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
  ],
})
export class AppModule {}
