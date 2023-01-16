import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AbsenceComponent } from './pages/absence.component';
import { AbsenceListComponent } from './components/absence-list/absence-list.component';
import { ABSENCE_ID } from '../../shared/utils/const';
import { ViewAbsenceComponent } from './components/view-absence/view-absence.component';

const absenceRoutes: Routes = [
  {
    path: '',
    component: AbsenceComponent,
    children: [
      {
        path: '',
        component: AbsenceListComponent,
      },
      {
        path: `:${ABSENCE_ID}/view`,
        component: ViewAbsenceComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(absenceRoutes)],
  exports: [RouterModule],
})
export class AbsenceRoutingModule {}
