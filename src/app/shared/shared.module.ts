import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignSystemModule, TableModule } from 'diflexmo-angular-design';
import { NgChartsModule } from 'ng2-charts';
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
  ],
  imports: [CommonModule, DesignSystemModule, ReactiveFormsModule, NgbDropdownModule, NgbPopoverModule, NgbAccordionModule, RouterLink],
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
  ],
})
export class SharedModule {}
