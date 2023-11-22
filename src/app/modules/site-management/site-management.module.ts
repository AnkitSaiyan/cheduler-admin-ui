import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { SiteManagementRoutingModule } from './site-management-routing.module';
import { SiteManagementComponent } from './pages/site-management.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
	declarations: [SiteManagementComponent],
	imports: [CommonModule, SiteManagementRoutingModule, SharedModule, ReactiveFormsModule],
})
export class SiteManagementModule {}
