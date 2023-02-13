import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { STAFF_ID } from '../../shared/utils/const';
import { EditEmailComponent } from './components/edit-email/edit-email.component';
import { EmailListComponent } from './components/email-list/email-list.component';
import { EmailComponent } from './pages/email/email.component';

const emailRoutes: Routes = [
  {
    path: '',
    component: EmailComponent,
    children: [
      {
        path: '',
        component: EmailListComponent,
      },
      {
        path: `edit`,
        component: EditEmailComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(emailRoutes)],
  exports: [RouterModule],
})
export class EmailRoutingModule {}
