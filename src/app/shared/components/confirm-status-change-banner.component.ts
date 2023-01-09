import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Status } from '../models/status';

@Component({
  selector: 'dfm-confirm-status-change-banner',
  template: `
    <div *ngIf="display" class="confirm-banner bg-white d-flex justify-content-between align-items-center dfm-gap-24 dfm-px-32 dfm-py-12 shadow-lg">
      <span class="font-weight-medium">Are you sure want to change Status?</span>
      <div class="d-flex align-items-center dfm-gap-16">
        <div class="dfm-input-dropdown-wrapper-wo-label flex-1 dropdown-wrapper">
          <dfm-input-dropdown
            #statusDropdown
            [items]="statuses"
            [showDescription]="false"
            placeholder="Status"
            size="sm"
            [formControl]="statusDropdownControl"
          ></dfm-input-dropdown>
        </div>

        <dfm-button color="secondary" size="md" (click)="handleClick(false)">Cancel</dfm-button>
        <dfm-button color="primary" size="md" (click)="handleClick(true)" [disabled]="statusDropdownControl.value === null"> Proceed </dfm-button>
      </div>
    </div>
  `,
  styles: [
    `
      .confirm-banner {
        transition: all 1000ms ease-in-out;
        position: absolute;
        left: 0;
        right: 0;
        z-index: 101;
        bottom: 0;
        border-top-right-radius: 20px;
        border-top-left-radius: 20px;

        .dropdown-wrapper {
          width: 160px;
        }
      }

      //.show-banner {
      //  bottom: 0;
      //  opacity: 1;
      //}
    `,
  ],
})
export class ConfirmStatusChangeBannerComponent implements OnInit {
  @Input() public display;

  @Output() private confirmationEvent = new EventEmitter<{ proceed: boolean; newStatus: Status | null }>();

  public statusDropdownControl = new FormControl(null, []);

  public statuses = [
    {
      name: 'Active',
      value: Status.Active,
    },
    {
      name: 'Inactive',
      value: Status.Inactive,
    },
  ] as any[];

  public ngOnInit() {}

  public handleClick(proceed: boolean) {
    if (!proceed) {
      this.confirmationEvent.emit({ proceed, newStatus: null });
    }

    if (this.statusDropdownControl.value) {
      this.confirmationEvent.emit({ proceed, newStatus: this.statusDropdownControl.value });
    }
  }
}
