import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { PhysicianRoutingModule } from './physician-routing.module';
import { PhysicianComponent } from './pages/physician.component';
import { PhysicianViewComponent } from './components/physician-view/physician-view.component';
import { PhysicianAddComponent } from './components/physician-add/physician-add.component';
import { PhysicianListComponent } from './components/physician-list/physician-list.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [PhysicianComponent, PhysicianListComponent, PhysicianViewComponent, PhysicianAddComponent],
  imports: [CommonModule, PhysicianRoutingModule, SharedModule, ReactiveFormsModule],
})
export class PhysicianModule {}
