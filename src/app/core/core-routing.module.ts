import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CoreComponent } from './core.component';

const routes: Routes = [
  {
    path: '',
    component: CoreComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: async () => (await import('../modules/dashboard/dashboard.module')).DashboardModule,
      },
      {
        path: 'staff',
        loadChildren: async () => (await import('../modules/staff/staff.module')).StaffModule,
      },
      {
        path: 'room',
        loadChildren: async () => (await import('../modules/rooms/rooms.module')).RoomsModule,
      },
      {
        path: 'physician',
        loadChildren: async () => (await import('../modules/physician/physician.module')).PhysicianModule,
      },
    ],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '*',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CoreRoutingModule {}
