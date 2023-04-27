import { Story, Meta } from '@storybook/angular/types-6-0';
import { moduleMetadata } from '@storybook/angular';
import { TableModule, IconCoreModule, IconModule, TableComponent } from 'diflexmo-angular-design';

const vessels: any[] = [
  {
    id: 'id-123',
    name: 'Name 1',
    description: 'This is the first element element with Name 1',
  },
  {
    id: 'id-321',
    name: 'Name 2',
    description: 'This is the second element with Name 2',
  },
  {
    id: 'id-999',
    name: 'Name 3',
    description: 'This is the third element with Name 3',
  },
];

export default {
  title: 'Design System/Table',
  component: TableComponent,
  decorators: [
    moduleMetadata({
      imports: [IconModule, IconCoreModule, TableModule],
    }),
  ],
  args: {},
} as Meta;

const Template: Story<TableComponent> = (args: TableComponent) => ({
  props: { items: args.items },
  template: `<dfm-table [items]="items" class="vessel-list">
  <ng-template #headerRowTemplate>
    <dfm-table-header-cell>Id</dfm-table-header-cell>
    <dfm-table-header-cell>Name</dfm-table-header-cell>
    <dfm-table-header-cell>Description</dfm-table-header-cell>
  </ng-template>
  <ng-template #bodyRowTemplate let-item>
    <dfm-table-body-cell>{{ item.id }}</dfm-table-body-cell>
    <dfm-table-body-cell>{{ item.name }}</dfm-table-body-cell>
    <dfm-table-body-cell>{{ item.description }}</dfm-table-body-cell>
  </ng-template>
</dfm-table>

`,
});

export const Table = Template.bind({});
Table.args = {
  items: vessels,
};
