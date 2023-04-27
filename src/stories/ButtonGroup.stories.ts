import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { ButtonModule, ButtonGroupComponent, IconCoreModule, IconModule } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Button',
  component: ButtonGroupComponent,
  decorators: [
    moduleMetadata({
      imports: [IconModule, IconCoreModule, ButtonModule],
    }),
  ],
  argTypes: {},
} as Meta;

const Template: Story<ButtonGroupComponent> = (args: ButtonGroupComponent) => ({
  props: args,
  template: `<dfm-button-group>
    <dfm-button-group-item>Text 1</dfm-button-group-item>
    <dfm-button-group-item>Text 2</dfm-button-group-item>
    <dfm-button-group-item icon="arrow-left">Text 3</dfm-button-group-item>
    <dfm-button-group-item icon="plus"></dfm-button-group-item>
    <dfm-button-group-item [disabled]="true">Text 4</dfm-button-group-item>
    </dfm-button-group>
    `,
});

export const ButtonGroup = Template.bind({});
ButtonGroup.args = {};
