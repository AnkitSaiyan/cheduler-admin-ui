import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Status } from '../models/status';

@Component({
  selector: 'dfm-confirm-status-change-banner',
  template: `
    <div *ngIf="display" class="confirm-banner dfm-gap-16 dfm-px-32 dfm-py-12 shadow-lg">
      <div class="hidden align-items-center justify-content-between dfm-gap-16">
        <h5 class="modal-title">Confirmation</h5>
        <dfm-button-icon color="tertiary-gray" icon="x-close" (click)="$event.stopPropagation(); handleClick(false)"></dfm-button-icon>
      </div>

      <div class="w-full">
        <span class="font-weight-medium">Are you sure want to change Status?</span>
      </div>

      <div class="d-flex align-items-center dfm-gap-16 w-fit">
        <div class="dfm-input-dropdown-wrapper-wo-label flex-1 dropdown-wrapper">
          <dfm-input-dropdown
            (click)="$event.stopPropagation()"
            #statusDropdown
            [items]="statuses"
            [showDescription]="false"
            placeholder="Status"
            size="md"
            [formControl]="statusDropdownControl"
          ></dfm-input-dropdown>
        </div>

        <div class="d-flex flex-row dfm-gap-16 align-items-center">
          <dfm-button color="secondary" size="md" (click)="$event.stopPropagation(); handleClick(false)">Cancel </dfm-button>
          <dfm-button
            color="primary"
            size="md"
            (click)="$event.stopPropagation(); handleClick(true)"
            [disabled]="statusDropdownControl.value === null"
          >
            Proceed
          </dfm-button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .confirm-banner {
        transition: all 1000ms ease-in-out;
        background: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: absolute;
        left: 0;
        right: 0;
        z-index: 1001;
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

      @media (max-width: 680px) {
        .confirm-banner {
          transition: all ease 200ms;
          flex-direction: column;
          justify-content: start !important;

          & > div,
          div:last-child {
            flex: 1;
            width: 100%;
          }

          div:first-child {
            display: flex;
          }

          div:last-child {
            transition: all ease 200ms;
            flex-direction: column;
            margin-bottom: 8px;

            div:first-child {
              margin-right: auto;
            }

            div:last-child {
              transition: all ease 200ms;

              dfm-button {
                height: 44px;
                flex: 1;
              }
            }
          }
        }
      }
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
    } else if (this.statusDropdownControl.value !== null) {
      this.confirmationEvent.emit({ proceed, newStatus: this.statusDropdownControl.value });
    }

    this.statusDropdownControl.setValue(null, { emitEvent: false });
  }
}
