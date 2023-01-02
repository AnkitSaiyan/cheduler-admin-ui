import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignSystemCoreModule, DesignSystemModule, TableModule } from 'diflexmo-angular-design';
import { NgChartsModule } from 'ng2-charts';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { ReactiveFormsModule } from '@angular/forms';
import { DestroyableComponent } from './components/destroyable.component';
import { StatusNamePipe } from './pipes/status-name.pipe';
import { DashIfNothingPipe } from './pipes/dash-if-nothing.pipe';
import { ConfirmStatusChangeBannerComponent } from './components/confirm-status-change-banner.component';

@NgModule({
  declarations: [DestroyableComponent, StatusNamePipe, DashIfNothingPipe, ConfirmStatusChangeBannerComponent],
  imports: [CommonModule, DesignSystemModule, DesignSystemCoreModule, ReactiveFormsModule],
  exports: [
    DesignSystemModule,
    DesignSystemCoreModule,
    TableModule,
    NgChartsModule,
    MdbCarouselModule,
    DashIfNothingPipe,
    StatusNamePipe,
    ConfirmStatusChangeBannerComponent,
  ],
})
export class SharedModule {}
