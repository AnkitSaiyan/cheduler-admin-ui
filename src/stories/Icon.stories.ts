import { Story, Meta } from '@storybook/angular/types-6-0';
import { moduleMetadata } from '@storybook/angular';
import { IconModule, IconCoreModule, IconComponent, iconsConfig } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Icons/Icon',
  component: IconComponent,
  decorators: [
    moduleMetadata({
      imports: [IconModule, IconCoreModule],
    }),
  ],
  argTypes: {
    name: {
      control: 'select',
      options: iconsConfig.iconImageFiles.map((icon) => icon.iconName),
    },
  },
} as Meta;

const Template: Story<IconComponent> = (args: IconComponent) => ({
  props: args,
  template: `<div style="width: 20px; height: 20px"><dfm-icon [name]="name"></dfm-icon></div>`,
});

export const Icon = Template.bind({});

Icon.args = {
  name: 'activity',
};
