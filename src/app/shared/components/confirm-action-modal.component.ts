import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs';
import { ModalService } from '../../core/services/modal.service';
import { DestroyableComponent } from './destroyable.component';

export interface ConfirmActionModalData {
  titleText: string;
  bodyText: string;
  confirmButtonText: string;
  cancelButtonText: string;
}

@Component({
  selector: 'dfm-confirm-action-modal',
  template: `
    <div #content class="bg-white rounded-4 confirm-action-modal">
      <div class="modal-header">
        <h5 class="modal-title">{{ modalData.titleText | translate }}</h5>
        <dfm-button-icon color="tertiary-gray" icon="x-close" (click)="close(false)"></dfm-button-icon>
      </div>

      <div class="modal-body">
        <p class="dfm-m-0">{{ modalData.bodyText | translate }}</p>
      </div>

      <div class="modal-footer">
        <dfm-button color="secondary" size="md"
                    (click)="close(false)">{{ modalData.cancelButtonText | translate }}</dfm-button>
        <dfm-button color="primary" size="md"
                    (click)="close(true)">{{ modalData.confirmButtonText | translate }}</dfm-button>
      </div>
    </div>
  `,
  styles: [
    `
      @media (max-width: 680px) {
        .confirm-action-modal {
          margin: auto 16px;
        }

        dfm-button {
          height: 44px;
          flex: 1;
        }
      }
    `,
  ],
})
export class ConfirmActionModalComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public modalData: ConfirmActionModalData = {
    confirmButtonText: 'Proceed',
    cancelButtonText: 'Cancel',
    titleText: 'Confirmation',
    bodyText: 'Are you sure you want to perform this action?',
  };

  constructor(private dialogSvc: ModalService, public translate: TranslateService) {
    super();
  }

  public ngOnInit() {
    this.dialogSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data: ConfirmActionModalData) => {
      if (data.bodyText) this.modalData.bodyText = data.bodyText;
      if (data.titleText) this.modalData.titleText = data.titleText;
      if (data.confirmButtonText) this.modalData.confirmButtonText = data.confirmButtonText;
      if (data.cancelButtonText) this.modalData.cancelButtonText = data.cancelButtonText;
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public close(result: boolean) {
    console.log(result);
    this.dialogSvc.close(result);
  }
}
