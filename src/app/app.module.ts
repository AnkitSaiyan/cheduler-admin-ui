import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DesignSystemCoreModule } from 'diflexmo-angular-design';
import { DatePipe } from '@angular/common';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { WeekdayToNamePipe } from './shared/pipes/weekday-to-name.pipe';
import { MonthToNamePipe } from './shared/pipes/month-to-name.pipe';
import { TimeInIntervalPipe } from './shared/pipes/time-in-interval.pipe';
import { NameValuePairPipe } from './shared/pipes/name-value-pair.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, ReactiveFormsModule, FormsModule, AppRoutingModule, HttpClientModule, DesignSystemCoreModule, BrowserAnimationsModule],
  bootstrap: [AppComponent],
  providers: [WeekdayToNamePipe, MonthToNamePipe, DatePipe, TimeInIntervalPipe, NameValuePairPipe],
})
export class AppModule {}
