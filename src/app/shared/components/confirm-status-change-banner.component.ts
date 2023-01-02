import { Component, EventEmitter, HostBinding, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Status } from '../models/status';

@Component({
  selector: 'dfm-confirm-status-change-banner',
  template: `
    <div
      *ngIf="display"
      class="bg-white d-flex justify-content-between align-items-center dfm-gap-24 dfm-px-32 dfm-py-8 shadow-sm confirm-banner"
      [ngClass]="bannerPosition === 'top' ? 'position-top' : 'position-bottom'"
    >
      <span>Are you sure want to change Status?</span>
      <div class="d-flex align-items-center dfm-gap-16">
        <div class="dfm-btn-group flex-1 dropdown-wrapper">
          <dfm-input-dropdown
            #statusDropdown
            [items]="statuses"
            [showDescription]="false"
            placeholder="Status"
            size="sm"
            [formControl]="statusDropdownControl"
          ></dfm-input-dropdown>
        </div>

        <dfm-button color="secondary" size="md" (click)="handleProceedClick(false)">Cancel</dfm-button>
        <dfm-button color="primary" size="md" (click)="handleProceedClick(true)" [disabled]="statusDropdownControl.invalid">Proceed </dfm-button>
      </div>
    </div>
  `,
  styles: [
    `
      .confirm-banner {
        transition: bottom 1s;
        position: absolute;
        left: 0;
        right: 0;
        z-index: 101;

        //.dropdown-wrapper {
        //  width: 128px;
        //}
      }

      .position-top {
        top: 0;
        border-bottom-right-radius: 16px;
        border-bottom-left-radius: 16px;
      }

      .position-bottom {
        bottom: 0;
        //transition: bottom 1s;
        border-top-right-radius: 16px;
        border-top-left-radius: 16px;
      }
    `,
  ],
})
export class ConfirmStatusChangeBannerComponent implements OnInit, OnChanges {
  @Input() public display;

  @Input() public bannerPosition: 'bottom' | 'top' = 'bottom';

  @Output() private confirmationEvent = new EventEmitter<{ proceed: boolean; newStatus: Status | null }>();

  @HostBinding('class.confirm-banner') public displayBanner = false;

  public statusDropdownControl = new FormControl(null, [Validators.required]);

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

  public ngOnChanges() {
    this.displayBanner = this.display;
  }

  public handleProceedClick(proceed: boolean) {
    if (this.statusDropdownControl.valid) {
      this.confirmationEvent.emit({ proceed, newStatus: this.statusDropdownControl.value });
    }
  }
}
