import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { PracticeHoursRoutingModule } from './practice-hours-routing.module';
import { PracticeHoursComponent } from './pages/practice-hours.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
	declarations: [PracticeHoursComponent],
	imports: [CommonModule, PracticeHoursRoutingModule, SharedModule, ReactiveFormsModule],
})
export class PracticeHoursModule {}
