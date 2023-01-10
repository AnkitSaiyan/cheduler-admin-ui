import { Component, OnDestroy, OnInit } from '@angular/core';
import { map, takeUntil } from 'rxjs';
import { InputDropdownComponent } from 'diflexmo-angular-design';
import { ModalService } from '../../core/services/modal.service';
import { DestroyableComponent } from './destroyable.component';

@Component({
  selector: 'dfm-search-modal',
  template: `
    <div #content class="bg-white dfm-search-modal">
      <div class="d-flex dfm-gap-16 align-items-center">
        <div class="rounded-circle overflow-hidden">
          <dfm-button-icon color="tertiary-gray" size="md" icon="chevron-left" (click)="close(dropdown)"></dfm-button-icon>
        </div>

        <div class="flex-1">
          <dfm-input-dropdown
            #dropdown
            class="flex-1"
            size="md"
            placeholder="Search by Staff Name"
            [items]="filteredStaffs"
            [multiple]="true"
            [typeToSearch]="true"
            (searchInput)="handleSearch($event)"
          ></dfm-input-dropdown>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dfm-search-modal {
        height: 100vh;

        & > div {
          background: var(--bs-gray-200);
          padding: 16px;
        }
      }

      //@media (max-width: 680px) {
      //  dfm-button {
      //    height: 44px;
      //    flex: 1;
      //  }
      //}
    `,
  ],
})
export class SearchModalComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public staffs: any[] = [];

  public filteredStaffs: any[] = [];

  constructor(private dialogSvc: ModalService) {
    super();
  }

  public ngOnInit() {
    this.dialogSvc.dialogData$
      .pipe(
        map((users) => users.map((user) => ({ name: `${user.firstname} ${user.lastname}`, value: user.id }))),
        takeUntil(this.destroy$$),
      )
      .subscribe((users) => {
        this.staffs = [...users];
        this.filteredStaffs = [...users];
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public close(dropdown: InputDropdownComponent) {
    this.dialogSvc.close(dropdown.selectedItems);
  }

  handleSearch(searchText: string) {
    console.log(searchText);
    if (searchText) {
      this.filteredStaffs = [...this.staffs.filter((staffs) => staffs.name.toLowerCase().includes(searchText.toString()))];
    } else {
      this.filteredStaffs = [...this.staffs];
    }
  }
}
