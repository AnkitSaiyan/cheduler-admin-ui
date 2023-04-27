import { FormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { ErrorModule, IconCoreModule, IconModule, TextAreaComponent } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Text Area',
  component: TextAreaComponent,
  decorators: [
    moduleMetadata({
      imports: [IconModule, IconCoreModule, ErrorModule, FormsModule],
    }),
  ],
  argTypes: {
    label: {
      type: 'string',
    },
    hint: {
      type: 'string',
    },
    placeholder: {
      type: 'string',
    },
    disabled: {
      type: 'boolean',
    },
  },
} as Meta;

const Template: Story<TextAreaComponent> = (args: TextAreaComponent) => ({
  props: args,
  template: `<dfm-text-area [label]="label" [hint]="hint" [placeholder]="placeholder" [disabled]="disabled"></dfm-text-area>`,
});

export const TextArea = Template.bind({});
TextArea.args = {
  label: 'Description',
  hint: 'This is a hint text to help user.',
  placeholder: 'Enter a description...',
};
