import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PracticeHoursComponent } from './pages/practice-hours.component';

const practiceHoursRoutes: Routes = [
  {
    path: '',
    component: PracticeHoursComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(practiceHoursRoutes)],
  exports: [RouterModule],
})
export class PracticeHoursRoutingModule {}
