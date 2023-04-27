import { Story, Meta } from '@storybook/angular/types-6-0';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { IconModule, IconCoreModule, InputDropdownComponent, InputModule, TagModule, iconsConfig } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Inputs Dropdown',
  component: InputDropdownComponent,
  decorators: [
    moduleMetadata({
      imports: [FormsModule, IconModule, IconCoreModule, InputModule, TagModule],
    }),
  ],
  argTypes: {
    label: {
      type: 'string',
    },
    hint: {
      type: 'string',
    },
    showDescription: {
      type: 'boolean',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    placeholder: {
      type: 'string',
    },
    multiple: {
      type: 'boolean',
    },
    icon: {
      control: 'select',
      options: iconsConfig.iconImageFiles.map((icon) => icon.iconName),
    },
    minQueryLengh: {
      type: 'number',
    },
    typeToSearch: {
      type: 'boolean',
    },
    typeToSearchText: {
      type: 'string',
    },
    loading: {
      type: 'boolean',
    },
    asyncSearch: {
      type: 'boolean',
    },
  },
} as Meta;

const Template: Story<InputDropdownComponent> = (args: InputDropdownComponent) => ({
  props: args,
});

export const InputDropdown = Template.bind({});
InputDropdown.args = {
  label: 'User',
  hint: 'This is a hint text to help user.',
  showDescription: true,
  size: 'md',
  placeholder: 'Select team member',
  items: [
    { name: 'Olivia Diff', value: '@olivia', description: '@olivia' },
    { name: 'Phoenix Baker', value: '@phoenix', description: '@phoenix' },
    { name: 'Lana Steiner', value: '@lana', description: '@lana' },
  ],
  value: [],
  icon: 'search-lg',
  selectedItems: [],
  filteredItems: [
    { name: 'Olivia Diff', value: '@olivia', description: '@olivia' },
    { name: 'Phoenix Baker', value: '@phoenix', description: '@phoenix' },
    { name: 'Lana Steiner', value: '@lana', description: '@lana' },
  ],
  onChange: () => {},
  onTouch: () => {},
};
