import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BrowserUtils } from '@azure/msal-browser';
import { MsalGuard } from '@azure/msal-angular';
import {CompleteProfileComponent} from "./shared/components/complete-profile/complete-profile.component";
import {ProfileCompleteGuard} from "./core/guard/profile-complete.guard";

const rootRoutes: Routes = [
  // {
  //   path: 'auth',
  //   loadChildren: async () => (await import('./core/auth/auth.module')).AuthModule,
  //   canActivate: [MsalGuard],
  // },
  {
    path: 'complete-profile',
    title: 'Cheduler - Complete Profile',
    component: CompleteProfileComponent,
    canActivate: [MsalGuard, ProfileCompleteGuard],
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
