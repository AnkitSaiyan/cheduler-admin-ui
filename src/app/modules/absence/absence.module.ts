import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { AbsenceRoutingModule } from './absence-routing.module';
import { AbsenceComponent } from './pages/absence.component';
import { AbsenceListComponent } from './components/absence-list/absence-list.component';
import { ViewAbsenceComponent } from './components/view-absence/view-absence.component';
import { AddAbsenceComponent } from './components/add-absence/add-absence.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [AbsenceComponent, AbsenceListComponent, ViewAbsenceComponent, AddAbsenceComponent],
  imports: [CommonModule, AbsenceRoutingModule, ReactiveFormsModule, SharedModule],
})
export class AbsenceModule {}
