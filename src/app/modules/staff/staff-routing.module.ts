import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StaffComponent } from './pages/staff.component';
import { StaffListComponent } from './components/staff-list/staff-list.component';
import { STAFF_ID } from '../../shared/utils/const';
import { StaffViewComponent } from './components/staff-view/staff-view.component';
import { AddStaffComponent } from './components/add-staff/add-staff.component';

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
        component: AddStaffComponent,
      },
      {
        path: `:${STAFF_ID}/view`,
        component: StaffViewComponent,
      },
      {
        path: `:${STAFF_ID}/edit`,
        component: AddStaffComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(staffRoutes)],
  exports: [RouterModule],
})
export class StaffRoutingModule {}
