import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteName, RouteType } from 'src/app/shared/models/permission.model';
import { PhysicianComponent } from './pages/physician.component';
import { PhysicianListComponent } from './components/physician-list/physician-list.component';
import { PHYSICIAN_ID } from '../../shared/utils/const';
import { PhysicianViewComponent } from './components/physician-view/physician-view.component';

const physicianRoutes: Routes = [
  {
    path: '',
    component: PhysicianComponent,
    children: [
      {
        path: '',
        component: PhysicianListComponent,
        data: { routeType: RouteType.View, routeName: RouteName.Physicians },
      },
      {
        path: `:${PHYSICIAN_ID}/view`,
        component: PhysicianViewComponent,
        data: { routeType: RouteType.View, routeName: RouteName.Physicians },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(physicianRoutes)],
  exports: [RouterModule],
})
export class PhysicianRoutingModule {}
