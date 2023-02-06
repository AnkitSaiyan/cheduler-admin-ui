import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { ExamRoutingModule } from './exam-routing.module';
import { ExamComponent } from './pages/exam.component';
import { ExamListComponent } from './components/exam-list/exam-list.component';
import { ViewExamComponent } from './components/view-exam/view-exam.component';
import { AddExamComponent } from './components/add-exam/add-exam.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [ExamComponent, ExamListComponent, ViewExamComponent, AddExamComponent],
  imports: [CommonModule, ExamRoutingModule, SharedModule, ReactiveFormsModule],
})
export class ExamModule {}
