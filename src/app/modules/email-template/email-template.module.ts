import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailTemplateComponent } from './pages/email/email-template.component';
import { EmailTemplateListComponent } from './components/email-template-list/email-template-list.component';
import { EditEmailTemplateComponent } from './components/edit-email/edit-email-template.component';
import { EmailRoutingModule } from './email-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularEditorModule } from '@kolkov/angular-editor';


@NgModule({
  declarations: [
    EmailTemplateComponent,
    EmailTemplateListComponent,
    EditEmailTemplateComponent,
  ],
  imports: [
    CommonModule,
    EmailRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    AngularEditorModule
  ]
})
export class EmailTemplateModule { }
