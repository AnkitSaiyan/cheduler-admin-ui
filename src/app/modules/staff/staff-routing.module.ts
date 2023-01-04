import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StaffComponent } from './pages/staff.component';
import { StaffListComponent } from './components/staff-list/staff-list.component';
import { StaffAddComponent } from './components/staff-add/staff-add.component';
import { STAFF_ID } from '../../shared/utils/const';
import { StaffViewComponent } from './components/staff-view/staff-view.component';

const staffRoutes: Routes = [
  {
    path: '',
    component: StaffComponent,
    title: 'Staff',
    children: [
      {
        path: '',
        component: StaffListComponent,
      },
      {
        path: 'add',
        component: StaffAddComponent,
      },
      {
        path: `:${STAFF_ID}/view`,
        component: StaffViewComponent,
      },
      {
        path: `:${STAFF_ID}/edit`,
        component: StaffAddComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(staffRoutes)],
  exports: [RouterModule],
})
export class StaffRoutingModule {}
