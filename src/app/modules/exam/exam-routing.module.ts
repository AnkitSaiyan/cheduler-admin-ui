import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteName, RouteType } from 'src/app/shared/models/permission.model';
import { ExamComponent } from './pages/exam.component';
import { ExamListComponent } from './components/exam-list/exam-list.component';
import { EXAM_ID } from '../../shared/utils/const';
import { ViewExamComponent } from './components/view-exam/view-exam.component';
import { AddExamComponent } from './components/add-exam/add-exam.component';

const examRoutes: Routes = [
  {
    path: '',
    component: ExamComponent,
    children: [
      {
        path: '',
        component: ExamListComponent,
        data: { routeType: RouteType.View, routeName: RouteName.Exams },
      },
      {
        path: 'add',
        component: AddExamComponent,
        data: { routeType: RouteType.Add, routeName: RouteName.Exams },
      },
      {
        path: `:${EXAM_ID}/view`,
        component: ViewExamComponent,
        data: { routeType: RouteType.View, routeName: RouteName.Exams },
      },
      {
        path: `:${EXAM_ID}/edit`,
        component: AddExamComponent,
        data: { routeType: RouteType.Add, routeName: RouteName.Exams },
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
  imports: [RouterModule.forChild(examRoutes)],
  exports: [RouterModule],
})
export class ExamRoutingModule {}
