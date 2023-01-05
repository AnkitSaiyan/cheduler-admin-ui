import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignSystemCoreModule, DesignSystemModule, TableModule } from 'diflexmo-angular-design';
import { NgChartsModule } from 'ng2-charts';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { DestroyableComponent } from './components/destroyable.component';
import { StatusNamePipe } from './pipes/status-name.pipe';
import { DashIfNothingPipe } from './pipes/dash-if-nothing.pipe';
import { ConfirmStatusChangeBannerComponent } from './components/confirm-status-change-banner.component';
import { WeekDayToNamePipe } from './pipes/week-day-to-name.pipe';
import { InputDropdownWrapperComponent } from './components/input-dropdown-wrapper.component';

@NgModule({
  declarations: [
    DestroyableComponent,
    StatusNamePipe,
    DashIfNothingPipe,
    ConfirmStatusChangeBannerComponent,
    WeekDayToNamePipe,
    InputDropdownWrapperComponent,
  ],
  imports: [CommonModule, DesignSystemModule, DesignSystemCoreModule, ReactiveFormsModule],
  exports: [
    DesignSystemModule,
    DesignSystemCoreModule,
    TableModule,
    NgChartsModule,
    MdbCarouselModule,
    NgbTimepickerModule,
    DashIfNothingPipe,
    StatusNamePipe,
    ConfirmStatusChangeBannerComponent,
    WeekDayToNamePipe,
  ],
})
export class SharedModule {}
