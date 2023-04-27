import { Story, Meta } from '@storybook/angular/types-6-0';
import { moduleMetadata } from '@storybook/angular';
import { IconModule, IconCoreModule, BadgeIconComponent, iconsConfig } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Badge',
  component: BadgeIconComponent,
  decorators: [
    moduleMetadata({
      imports: [IconModule, IconCoreModule],
    }),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['primary', 'primary-dark', 'success', 'success-dark', 'warning', 'secondary', 'gray'],
    },
    icon: {
      control: 'select',
      options: iconsConfig.iconImageFiles.map((icon) => icon.iconName),
    },
  },
} as Meta;

const Template: Story<BadgeIconComponent> = (args: BadgeIconComponent) => ({
  props: args,
  template: `<dfm-badge-icon [icon]="icon" [color]="color" [size]="size">Label</dfm-badge-icon>`,
});

export const BadgeIcon = Template.bind({});
BadgeIcon.args = {
  size: 'sm',
  color: 'primary',
  icon: 'placeholder',
};
