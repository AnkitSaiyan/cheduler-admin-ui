import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PRIORITY_ID } from '../../shared/utils/const';
import { ListPrioritySlotsComponent } from './components/list-priority-slots/list-priority-slots.component';
import { ViewPrioritySlotsComponent } from './components/view-priority-slots/view-priority-slots.component';
import { PrioritySlotsComponent } from './pages/priority-slots/priority-slots.component';

const prioritySlotsRoutes: Routes = [
  {
    path: '',
    component: PrioritySlotsComponent,
    children: [
      {
        path: '',
        component: ListPrioritySlotsComponent,
      },
      {
        path: `:${PRIORITY_ID}/view`,
        component: ViewPrioritySlotsComponent,
      },
      {
        path: '**',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(prioritySlotsRoutes)],
  exports: [RouterModule],
})
export class PrioritySlotsRoutingModule {}
