import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { ButtonComponent, IconCoreModule, IconModule, iconsConfig } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Button',
  component: ButtonComponent,
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
      options: ['primary', 'secondary', 'secondary-gray', 'tertiary', 'tertiary-gray', 'link', 'link-gray'],
    },
    disabled: {
      type: 'boolean',
    },
    leadingIcon: {
      control: 'select',
      options: iconsConfig.iconImageFiles.map((icon) => icon.iconName),
    },
    trailingIcon: {
      control: 'select',
      options: iconsConfig.iconImageFiles.map((icon) => icon.iconName),
    },
    innerHtml: {
      type: 'string',
      defaultValue: 'Button CTA',
    },
  },
} as Meta;

const Template: Story<ButtonComponent> = (args: ButtonComponent) => ({
  props: args,
  template: `<dfm-button [color]="color" [size]="size" [leadingIcon]="leadingIcon" [trailingIcon]="trailingIcon"
    [disabled]="disabled">{{innerHtml}}</dfm-button>`,
});

export const Button = Template.bind({});
Button.args = {
  size: 'lg',
  color: 'primary',
  leadingIcon: 'placeholder',
  trailingIcon: 'placeholder',
};
