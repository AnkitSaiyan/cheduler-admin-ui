import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { AbsenceRoutingModule } from './absence-routing.module';
import { AbsenceComponent } from './pages/absence.component';
import { AbsenceListComponent } from './components/absence-list/absence-list.component';
import { ViewAbsenceComponent } from './components/view-absence/view-absence.component';
import { AddAbsenceComponent } from './components/add-absence/add-absence.component';
import { SharedModule } from '../../shared/shared.module';
import { AbsenceTableViewComponent } from './components/absence-table-view/absence-table-view.component';
import { AbsenceCalendarViewComponent } from './components/absence-calendar-view/absence-calendar-view.component';

@NgModule({
	declarations: [
		AbsenceComponent,
		AbsenceListComponent,
		ViewAbsenceComponent,
		AddAbsenceComponent,
		AbsenceTableViewComponent,
		AbsenceCalendarViewComponent,
	],
	imports: [CommonModule, AbsenceRoutingModule, ReactiveFormsModule, SharedModule],
	providers: [],
})
export class AbsenceModule {}
