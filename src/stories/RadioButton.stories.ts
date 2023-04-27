import { Story, Meta } from '@storybook/angular/types-6-0';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { IconCoreModule, IconModule, RadioButtonComponent } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Checkboxes',
  component: RadioButtonComponent,
  decorators: [
    moduleMetadata({
      imports: [IconModule, IconCoreModule, FormsModule],
    }),
  ],
  argTypes: {
    label: {
      type: 'string',
      control: 'text',
    },
    hint: {
      type: 'string',
      control: 'text',
    },
    value: {
      type: 'boolean',
    },
    checkedValue: {
      type: 'boolean',
    },
    disabled: {
      type: 'boolean',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
} as Meta;

const Template: Story<RadioButtonComponent> = (args: RadioButtonComponent) => ({
  props: args,
});

export const RadioButton = Template.bind({});
RadioButton.args = {
  label: 'Remember me',
  hint: 'Save my logging details for the next time',
  size: 'sm',
  value: false,
  checkedValue: true,
  onChange: () => {},
  onTouch: () => {},
};
