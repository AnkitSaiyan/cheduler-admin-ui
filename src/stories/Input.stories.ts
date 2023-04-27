import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Meta, Story, moduleMetadata } from '@storybook/angular';
import { ErrorModule, IconCoreModule, IconModule, InputComponent, iconsConfig } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Input',
  component: InputComponent,
  decorators: [
    moduleMetadata({
      imports: [IconModule, IconCoreModule, ErrorModule, FormsModule, ReactiveFormsModule],
      providers: [],
    }),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    disabled: {
      type: 'boolean',
    },
    placeholder: {
      type: 'string',
    },
    label: {
      type: 'string',
    },
    hint: {
      type: 'string',
    },
    type: {
      control: 'select',
      options: ['email', 'number', 'text', 'datepicker'],
    },
    icon: {
      control: 'select',
      options: iconsConfig.iconImageFiles.map((icon) => icon.iconName),
    },
    isInvalid: {
      type: 'boolean',
    },
    readonly: {
      type: 'boolean',
    },
  },
} as Meta;

const Template: Story<InputComponent> = (args: InputComponent) => ({
  props: args,
});

export const Input = Template.bind({});
Input.args = {
  size: 'md',
  placeholder: 'me@diflexmo.com',
  label: 'Email',
  hint: 'This is a hint text to help user.',
  icon: 'search-sm',
  onChange: () => {},
  onTouched: () => {},
};
