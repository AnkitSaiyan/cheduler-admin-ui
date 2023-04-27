import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { ButtonIconComponent, IconCoreModule, IconModule, iconsConfig } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Button',
  component: ButtonIconComponent,
  decorators: [
    moduleMetadata({
      imports: [IconModule, IconCoreModule],
    }),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'secondary-gray', 'tertiary', 'tertiary-gray'],
    },
    disabled: {
      type: 'boolean',
    },
    icon: {
      control: 'select',
      options: iconsConfig.iconImageFiles.map((icon) => icon.iconName),
    },
  },
} as Meta;

const Template: Story<ButtonIconComponent> = (args: ButtonIconComponent) => ({
  props: args,
  template: `<dfm-button-icon [color]="color" [size]="size" [icon]="icon" [disabled]="disabled"></dfm-button-icon>`,
});

export const ButtonIcon = Template.bind({});
ButtonIcon.args = {
  size: 'lg',
  color: 'primary',
  icon: 'placeholder',
};
