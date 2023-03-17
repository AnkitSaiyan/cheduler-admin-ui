import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EMAIL_TEMPLATE_ID } from '../../shared/utils/const';
import { EditEmailTemplateComponent } from './components/edit-email-template/edit-email-template.component';
import { EmailTemplateListComponent } from './components/email-template-list/email-template-list.component';
import { EmailTemplateComponent } from './pages/email/email-template.component';

const emailRoutes: Routes = [
  {
    path: '',
    component: EmailTemplateComponent,
    children: [
      {
        path: '',
        component: EmailTemplateListComponent,
      },
      {
        path: `:${EMAIL_TEMPLATE_ID}/edit`,
        component: EditEmailTemplateComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(emailRoutes)],
  exports: [RouterModule],
})
export class EmailRoutingModule {}
