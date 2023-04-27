import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { Meta, Story } from '@storybook/angular/types-6-0';
import { ButtonModule, DatepickerComponent, ErrorModule, IconCoreModule, IconModule, InputModule } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Datepicker',
  component: DatepickerComponent,
  decorators: [
    moduleMetadata({
      imports: [CommonModule, IconModule, IconCoreModule, ErrorModule, FormsModule, ReactiveFormsModule, InputModule, ButtonModule],
      providers: [],
    }),
  ],
} as Meta;

const Template: Story<DatepickerComponent> = () => ({
  props: {},
});

export const Datepicker = Template.bind({});
Datepicker.args = {};
