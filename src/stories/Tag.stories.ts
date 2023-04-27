import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { IconCoreModule, IconModule, TagComponent, iconsConfig } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Tag',
  component: TagComponent,
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
      options: ['default', 'white', 'brown'],
    },
    action: {
      control: 'select',
      options: ['close', 'count', null],
    },
    count: {
      type: 'number',
    },
    icon: {
      control: 'select',
      options: iconsConfig.iconImageFiles.map((icon) => icon.iconName),
    },
  },
} as Meta;

const Template: Story<TagComponent> = (args: TagComponent) => ({
  props: args,
  template: `<dfm-tag [color]="color" [size]="size" [action]="action" [count]="count" [iconName]="iconName">Label</dfm-tag>`,
});

export const Tag = Template.bind({});
Tag.args = {
  size: 'lg',
  color: 'default',
};
