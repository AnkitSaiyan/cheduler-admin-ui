import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignSystemModule, TableModule } from 'diflexmo-angular-design';
import { NgChartsModule } from 'ng2-charts';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModalModule, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { DestroyableComponent } from './components/destroyable.component';
import { StatusNamePipe } from './pipes/status-name.pipe';
import { DashIfNothingPipe } from './pipes/dash-if-nothing.pipe';
import { ConfirmStatusChangeBannerComponent } from './components/confirm-status-change-banner.component';
import { WeekDayToNamePipe } from './pipes/week-day-to-name.pipe';
import { InputDropdownWrapperComponent } from './components/input-dropdown-wrapper.component';
import { ConfirmActionModalComponent } from './components/confirm-action-modal.component';
import { TimeInIntervalPipe } from './pipes/time-in-interval.pipe';
import { SearchModalComponent } from './components/search-modal.component';

@NgModule({
  declarations: [
    DestroyableComponent,
    StatusNamePipe,
    DashIfNothingPipe,
    ConfirmStatusChangeBannerComponent,
    WeekDayToNamePipe,
    InputDropdownWrapperComponent,
    ConfirmActionModalComponent,
    TimeInIntervalPipe,
    SearchModalComponent,
  ],
  imports: [CommonModule, DesignSystemModule, ReactiveFormsModule],
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
    WeekDayToNamePipe,
    ConfirmActionModalComponent,
    TimeInIntervalPipe,
    SearchModalComponent,
  ],
})
export class SharedModule {}
