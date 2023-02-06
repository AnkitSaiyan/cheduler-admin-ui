import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { UserRoutingModule } from './user-routing.module';
import { UserComponent } from './pages/user.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { AddUserComponent } from './components/add-user/add-user.component';
import { ViewUserComponent } from './components/view-user/view-user.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [UserComponent, UserListComponent, AddUserComponent, ViewUserComponent],
  imports: [CommonModule, UserRoutingModule, SharedModule, ReactiveFormsModule],
})
export class UserModule {}
