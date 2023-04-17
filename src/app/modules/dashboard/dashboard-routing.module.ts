import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DashboardComponent} from "./pages/dashboard.component";

const routes: Routes = [
	{
		path: '',
		component: DashboardComponent,
		title: 'Cheduler - Dashboard',
	},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }

