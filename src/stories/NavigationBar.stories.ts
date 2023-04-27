import { RouterTestingModule } from '@angular/router/testing';
import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { IconCoreModule, IconModule, NavigationBarModule, NavigationBarComponent } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Navigation Bar',
  component: NavigationBarComponent,
  decorators: [
    moduleMetadata({
      imports: [IconModule, IconCoreModule, NavigationBarModule, RouterTestingModule],
    }),
  ],
  argTypes: {
    isCollapsed: {
      type: 'boolean',
    },
  },
} as Meta;

const NavigationTemplate: Story<NavigationBarComponent> = (args: NavigationBarComponent) => ({
  props: args,
  template: `<dfm-navigation-bar [content]="content">
  <ng-template #navigationItems>
    <dfm-navigation-item icon="home-03" title="Dashboard" routerLink="/" [exact]="true"></dfm-navigation-item>
    <dfm-navigation-item icon="anchor" title="Vessels" routerLink="/vessels"></dfm-navigation-item>
    <dfm-navigation-item icon="passport" title="End devices"></dfm-navigation-item>
    <dfm-navigation-item icon="speedometer-02" title="OVC's"></dfm-navigation-item>
    <dfm-navigation-item icon="tool-02" title="Installations"></dfm-navigation-item>
    <dfm-navigation-item icon="dots-grid" title="Operations"></dfm-navigation-item>
  </ng-template>
  <ng-template #profileItems>
    <dfm-navigation-item-tenant [tenants]="tenants" [currentTenantValue]="currentTenant" (tenantChanged)="changeTenant($event)"
      >Diflexmo</dfm-navigation-item-tenant
    >
    <dfm-navigation-item icon="user-01" title="Profile"></dfm-navigation-item>
  </ng-template>
</dfm-navigation-bar>
<div class="content" #content>
  <router-outlet></router-outlet>
</div>`,
});

export const NavigationBar = NavigationTemplate.bind({});
NavigationBar.args = {
  isCollapsed: false,
};
