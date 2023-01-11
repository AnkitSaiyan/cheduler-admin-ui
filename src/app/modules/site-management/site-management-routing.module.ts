import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SiteManagementComponent } from './pages/site-management.component';

const siteManagementRoutes: Routes = [
  {
    path: '',
    component: SiteManagementComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(siteManagementRoutes)],
  exports: [RouterModule],
})
export class SiteManagementRoutingModule {}
