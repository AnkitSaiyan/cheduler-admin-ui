import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignSystemModule, TableModule } from 'diflexmo-angular-design';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { ReactiveFormsModule } from '@angular/forms';
import {
  NgbAccordionModule,
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbPopoverModule,
  NgbTimepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DestroyableComponent } from './components/destroyable.component';
import { StatusNamePipe } from './pipes/status-name.pipe';
import { DashIfNothingPipe } from './pipes/dash-if-nothing.pipe';
import { ConfirmStatusChangeBannerComponent } from './components/confirm-status-change-banner.component';
import { WeekdayToNamePipe } from './pipes/weekday-to-name.pipe';
import { InputDropdownWrapperComponent } from './components/input-dropdown-wrapper.component';
import { ConfirmActionModalComponent } from './components/confirm-action-modal.component';
import { TimeInIntervalPipe } from './pipes/time-in-interval.pipe';
import { SearchModalComponent } from './components/search-modal.component';
import { DfmSpinnerComponent } from './components/dfm-spinner.component';
import { MonthToNamePipe } from './pipes/month-to-name.pipe';
import { JoinWithAndPipe } from './pipes/join-with-and.pipe';
import { NameValuePairPipe } from './pipes/name-value-pair.pipe';
import { ApprovalTypeNamePipe } from './pipes/approval-type-name.pipe';
import { SumPipe } from './pipes/sum.pipe';
import { RepeatTypeToNamePipe } from './pipes/repeat-type-to-name.pipe';
import { AppendTextToInputDirective } from './directives/append-text-to-input.directive';
import { DfmCalendarMonthViewComponent } from './components/dfm-calendar/dfm-calendar-month-view/dfm-calendar-month-view.component';
import { DfmCalendarWeekViewComponent } from './components/dfm-calendar/dfm-calendar-week-view/dfm-calendar-week-view.component';
import { DfmCalendarDayViewComponent } from './components/dfm-calendar/dfm-calendar-day-view/dfm-calendar-day-view.component';
import { NumberToDatePipe } from './pipes/number-to-date.pipe';
import { LargestPipe } from './pipes/largest.pipe';
import { NameInputDirective } from './directives/name-input.directive';
import { EmailInputDirective } from './directives/email-input.directive';
import { NumberInputDirective } from './directives/number-input.directive';
import { NumberArrayPipe } from './pipes/number-array.pipe';
// eslint-disable-next-line import/order
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
// eslint-disable-next-line import/order
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IsDataPipe } from './pipes/is-data.pipe';
import { TimeSlotsComponent } from './components/time-slots/time-slots.component';
import { MatSpinnerComponent } from './components/mat-spinner/mat-spinner.component';
import { RoleNamePipe } from './pipes/role-name.pipe';
import { IsPermittedDirective } from './directives/permission.directive';
import {UserRolePipe} from "./pipes/user-role.pipe";

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    DestroyableComponent,
    StatusNamePipe,
    DashIfNothingPipe,
    ConfirmStatusChangeBannerComponent,
    WeekdayToNamePipe,
    InputDropdownWrapperComponent,
    ConfirmActionModalComponent,
    TimeInIntervalPipe,
    SearchModalComponent,
    DfmSpinnerComponent,
    MonthToNamePipe,
    JoinWithAndPipe,
    NameValuePairPipe,
    ApprovalTypeNamePipe,
    SumPipe,
    RepeatTypeToNamePipe,
    AppendTextToInputDirective,
    DfmCalendarMonthViewComponent,
    DfmCalendarWeekViewComponent,
    DfmCalendarDayViewComponent,
    NumberToDatePipe,
    LargestPipe,
    NameInputDirective,
    EmailInputDirective,
    NumberInputDirective,
    IsPermittedDirective,
    NumberArrayPipe,
    IsDataPipe,
    TimeSlotsComponent,
    MatSpinnerComponent,
    RoleNamePipe,
    UserRolePipe
  ],
  imports: [
    CommonModule,
    DesignSystemModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    NgbPopoverModule,
    NgbAccordionModule,
    MatProgressSpinnerModule,
    RouterLink,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  exports: [
    DesignSystemModule,
    TableModule,
    NgChartsModule,
    MdbCarouselModule,
    NgbTimepickerModule,
    NgbModalModule,
    NgbDropdownModule,
    DashIfNothingPipe,
    StatusNamePipe,
    ConfirmStatusChangeBannerComponent,
    WeekdayToNamePipe,
    ConfirmActionModalComponent,
    TimeInIntervalPipe,
    SearchModalComponent,
    DfmSpinnerComponent,
    InputDropdownWrapperComponent,
    NgbDatepickerModule,
    MonthToNamePipe,
    JoinWithAndPipe,
    NameValuePairPipe,
    ApprovalTypeNamePipe,
    SumPipe,
    RepeatTypeToNamePipe,
    AppendTextToInputDirective,
    DfmCalendarMonthViewComponent,
    DfmCalendarWeekViewComponent,
    DfmCalendarDayViewComponent,
    NumberToDatePipe,
    NgbPopoverModule,
    NgbAccordionModule,
    LargestPipe,
    DragDropModule,
    NameInputDirective,
    EmailInputDirective,
    NumberInputDirective,
    IsPermittedDirective,
    NumberArrayPipe,
    ClipboardModule,
    TranslateModule,
    IsDataPipe,
    TimeSlotsComponent,
    MatSpinnerComponent,
    RoleNamePipe,
    UserRolePipe
  ],
  providers: [TranslatePipe],
})
export class SharedModule {}
