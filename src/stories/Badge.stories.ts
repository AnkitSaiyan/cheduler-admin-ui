import { Story, Meta } from '@storybook/angular/types-6-0';
import { moduleMetadata } from '@storybook/angular';
import { BadgeComponent, IconModule, IconCoreModule, iconsConfig } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Badge',
  component: BadgeComponent,
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
    iconStyle: {
      control: 'select',
      options: ['none', 'bullet', 'icon-left', 'icon-right', 'avatar', 'close'],
    },
    fontWeight: {
      control: 'select',
      options: ['medium', 'semi-bold'],
    },
    icon: {
      type: 'string',
      control: 'select',
      options: iconsConfig.iconImageFiles.map((icon) => icon.iconName),
    },
  },
} as Meta;

const Template: Story<BadgeComponent> = (args: BadgeComponent) => ({
  props: args,
  template: `<dfm-badge [fontWeight]="fontWeight" [iconStyle]="iconStyle" [icon]="icon" [color]="color" [size]="size">Label</dfm-badge>`,
});

export const Badge = Template.bind({});
Badge.args = {
  iconStyle: 'none',
  size: 'sm',
  color: 'primary',
  icon: 'placeholder',
  fontWeight: 'medium',
};
