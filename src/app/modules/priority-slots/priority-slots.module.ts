import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PrioritySlotsComponent } from './pages/priority-slots.component';
import { AddPrioritySlotsComponent } from './components/add-priority-slots/add-priority-slots.component';
import { ViewPrioritySlotsComponent } from './components/view-priority-slots/view-priority-slots.component';
import { ListPrioritySlotsComponent } from './components/list-priority-slots/list-priority-slots.component';
import { PrioritySlotsRoutingModule } from './priority-slots-routing.module';

@NgModule({
  declarations: [PrioritySlotsComponent, AddPrioritySlotsComponent, ViewPrioritySlotsComponent, ListPrioritySlotsComponent],
  imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule, PrioritySlotsRoutingModule],
})
export class PrioritySlotsModule {}
