import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { CoreRoutingModule } from './core-routing.module';
import { CoreComponent } from './core.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
	declarations: [CoreComponent],
	imports: [CommonModule, CoreRoutingModule, SharedModule, MatProgressBarModule],
	exports: [MatProgressBarModule],
})
export class CoreModule {}
