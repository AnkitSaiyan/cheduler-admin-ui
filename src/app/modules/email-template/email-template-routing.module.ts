import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RouteName, RouteType } from 'src/app/shared/models/permission.model';
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
        data: { routeType: RouteType.View, routeName: RouteName.EmailTemplate },
      },
      {
        path: `:${EMAIL_TEMPLATE_ID}/edit`,
        component: EditEmailTemplateComponent,
        data: { routeType: RouteType.Add, routeName: RouteName.EmailTemplate },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(emailRoutes)],
  exports: [RouterModule],
})
export class EmailTemplateRoutingModule {}

