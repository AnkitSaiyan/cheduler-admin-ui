import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { StaffRoutingModule } from './staff-routing.module';
import { StaffComponent } from './pages/staff.component';
import { StaffListComponent } from './components/staff-list/staff-list.component';
import { SharedModule } from '../../shared/shared.module';
import { StaffAddComponent } from './components/staff-add/staff-add.component';
import { StaffViewComponent } from './components/staff-view/staff-view.component';

@NgModule({
  declarations: [StaffComponent, StaffListComponent, StaffAddComponent, StaffViewComponent],
  imports: [CommonModule, StaffRoutingModule, SharedModule, ReactiveFormsModule],
})
export class StaffModule {}
