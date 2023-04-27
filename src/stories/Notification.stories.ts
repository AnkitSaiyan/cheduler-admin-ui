import { moduleMetadata } from '@storybook/angular';
import { Meta, Story } from '@storybook/angular/types-6-0';
import { DiflexmoNotification, NotificationType, PositionType, IconModule, IconCoreModule, NotificationComponent } from 'diflexmo-angular-design';

export default {
  title: 'Design System/Notification',
  component: NotificationComponent,
  decorators: [
    moduleMetadata({
      imports: [IconCoreModule, IconModule],
    }),
  ],
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: [0, 1, 2, 3],
      },
    },
    position: {
      control: 'select',
      mapping: [PositionType.BOTTOM_LEFT, PositionType.BOTTOM_RIGHT, PositionType.TOP_LEFT, PositionType.TOP_RIGHT],
      options: ['Bottom left', 'Bottom right', 'Top left', 'Top right'],
    },
  },
} as Meta;

const Template: Story<NotificationComponent> = (args: NotificationComponent) => {
  const currentNotification = { ...args.currentNotification };
  if (args && args.currentNotification && (args as any).type >= 0) {
    currentNotification.type = (args as any).type as NotificationType;
  }
  return {
    props: {
      currentNotification,
    },
    template: `<dfm-notification [position]="position"></dfm-notification>`,
  };
};

export const Notification = Template.bind({});
Notification.args = {
  currentNotification: new DiflexmoNotification(NotificationType.DANGER, 'Successfully saved', '', true),
  position: PositionType.BOTTOM_LEFT,
};
