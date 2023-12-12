import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { EmailTemplateComponent } from './pages/email/email-template.component';
import { EmailTemplateListComponent } from './components/email-template-list/email-template-list.component';
import { EditEmailTemplateComponent } from './components/edit-email-template/edit-email-template.component';
import { EmailTemplateRoutingModule } from './email-template-routing.module';

@NgModule({
	declarations: [EmailTemplateComponent, EmailTemplateListComponent, EditEmailTemplateComponent],
	imports: [CommonModule, EmailTemplateRoutingModule, SharedModule, FormsModule, ReactiveFormsModule, AngularEditorModule],
})
export class EmailTemplateModule {}
