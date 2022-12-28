import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BaseLayoutComponent } from './core/components/base-layout/base-layout.component';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: async () => (await import('./auth/auth.module')).AuthModule
  },
  {
    path: '',
    loadChildren: async () => (await import('./main/main.module')).MainModule
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
