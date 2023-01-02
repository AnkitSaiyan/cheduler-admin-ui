import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StaffComponent } from './pages/staff.component';
import { StaffListComponent } from './components/staff-list/staff-list.component';

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
    ],
  },
];
@NgModule({
  imports: [RouterModule.forChild(staffRoutes)],
  exports: [RouterModule],
})
export class StaffRoutingModule {}
