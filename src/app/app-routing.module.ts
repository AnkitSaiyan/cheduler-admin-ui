import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const rootRoutes: Routes = [
  {
    path: 'auth',
    loadChildren: async () => (await import('./core/auth/auth.module')).AuthModule
  },
  {
    path: '',
    loadChildren: async () => (await import('./core/core.module')).CoreModule
  }
];

@NgModule({
  imports: [RouterModule.forRoot(rootRoutes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
