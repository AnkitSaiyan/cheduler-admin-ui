import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserComponent } from './pages/user.component';
import { STAFF_ID } from '../../shared/utils/const';
import { ViewUserComponent } from './components/view-user/view-user.component';

const userRoutes: Routes = [
  {
    path: '',
    component: UserComponent,
    children: [
      {
        path: '',
        component: UserListComponent,
      },
      {
        path: `:${STAFF_ID}/view`,
        component: ViewUserComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(userRoutes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
