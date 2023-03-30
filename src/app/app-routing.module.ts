import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BrowserUtils } from '@azure/msal-browser';
import { MsalGuard } from '@azure/msal-angular';

const rootRoutes: Routes = [
  {
    path: 'auth',
    loadChildren: async () => (await import('./core/auth/auth.module')).AuthModule,
    canActivate: [MsalGuard],
  },
  {
    path: '',
    loadChildren: async () => (await import('./core/core.module')).CoreModule,
    canActivate: [MsalGuard],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(rootRoutes, {
      initialNavigation: !BrowserUtils.isInIframe() && !BrowserUtils.isInPopup() ? 'enabledNonBlocking' : 'disabled', // Set to enabledBlocking to use Angular Universal
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
