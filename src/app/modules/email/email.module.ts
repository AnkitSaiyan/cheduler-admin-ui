import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailComponent } from './pages/email/email.component';
import { EmailListComponent } from './components/email-list/email-list.component';
import { EditEmailComponent } from './components/edit-email/edit-email.component';
import { EmailRoutingModule } from './email-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    EmailComponent,
    EmailListComponent,
    EditEmailComponent,
  ],
  imports: [
    CommonModule,
    EmailRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class EmailModule { }
