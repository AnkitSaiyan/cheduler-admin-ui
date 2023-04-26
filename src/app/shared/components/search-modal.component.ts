import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { InputDropdownComponent } from 'diflexmo-angular-design-dev';
import { ModalService } from '../../core/services/modal.service';
import { DestroyableComponent } from './destroyable.component';

export interface NameValue {
  name: string; // display name
  key?: string; // search key
  value: any; // value to be used in background
  description?: string;
}

export interface SearchModalData {
  items: NameValue[];
  // searchByKeys: string[];
  placeHolder?: string;
}

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
            [placeholder]="placeholder"
            [items]="(filteredItems$$ | async) ?? []"
            [multiple]="true"
            [typeToSearch]="true"
            [showDescription]="true"
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
  public items$$ = new BehaviorSubject<any[]>([]);

  public filteredItems$$ = new BehaviorSubject<NameValue[]>([]);

  public placeholder = 'Search';

  // public searchControl = new FormControl('', []);

  constructor(private dialogSvc: ModalService) {
    super();
  }

  public ngOnInit() {
    this.dialogSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: (data: SearchModalData) => {
        this.items$$.next([...data.items]);
        this.filteredItems$$.next([...data.items]);
        this.placeholder = data?.placeHolder ?? this.placeholder;
      }
    });
    //
    // this.searchControl.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$)).subscribe((searchText) => {
    //   this.handleSearch(searchText?.toString()?.toLowerCase());
    // });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public close(dropdown: InputDropdownComponent) {
    this.dialogSvc.close(dropdown.selectedItems);
  }

  handleSearch(searchText: string | undefined) {
    if (searchText?.toString()?.toLowerCase()) {
      this.filteredItems$$.next([...this.items$$.value.filter((item) => item?.key?.toLowerCase()?.includes(searchText))]);
    } else {
      this.filteredItems$$.next([...this.items$$.value]);
    }
  }
}
