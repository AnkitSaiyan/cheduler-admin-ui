import { Story, Meta } from '@storybook/angular/types-6-0';
import { moduleMetadata } from '@storybook/angular';
import { IconModule, IconCoreModule, FeaturedIconComponent, iconsConfig } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Icons/Featured Icon',
  component: FeaturedIconComponent,
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
    color: {
      control: 'select',
      options: ['primary', 'gray', 'error', 'warning', 'success'],
    },
    theme: {
      control: 'select',
      options: ['light-circle', 'light-circle-outline', 'dark-circle'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
} as Meta;

const Template: Story<FeaturedIconComponent> = (args: FeaturedIconComponent) => ({
  props: args,
  template: `<dfm-featured-icon [name]="name" [color]="color" [theme]="theme" [size]="size"></dfm-featured-icon>`,
});

export const FeaturedIcon = Template.bind({});

FeaturedIcon.args = {
  name: 'activity',
};
