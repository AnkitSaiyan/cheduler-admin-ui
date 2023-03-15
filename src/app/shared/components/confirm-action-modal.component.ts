import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs';
import { ModalService } from '../../core/services/modal.service';
import { DestroyableComponent } from './destroyable.component';

export interface DialogData {
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
        <h5 class="modal-title">{{ dialogData.titleText | translate }}</h5>
        <dfm-button-icon color="tertiary-gray" icon="x-close" (click)="close(false)"></dfm-button-icon>
      </div>

      <div class="modal-body">
        <p class="dfm-m-0">{{ dialogData.bodyText | translate }}</p>
      </div>

      <div class="modal-footer">
        <dfm-button color="secondary" size="md" (click)="close(false)">{{ dialogData.cancelButtonText | translate }}</dfm-button>
        <dfm-button color="primary" size="md" (click)="close(true)">{{ dialogData.confirmButtonText | translate }}</dfm-button>
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
  public dialogData: DialogData = {
    confirmButtonText: 'Proceed',
    cancelButtonText: 'Cancel',
    titleText: 'Confirmation',
    bodyText: 'Are you sure you want to perform this action?',
  };

  constructor(private dialogSvc: ModalService, public translate: TranslateService) {
    super();
  }

  public ngOnInit() {
    this.dialogSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data: DialogData) => {
      if (data.bodyText) this.dialogData.bodyText = data.bodyText;
      if (data.titleText) this.dialogData.titleText = data.titleText;
      if (data.confirmButtonText) this.dialogData.confirmButtonText = data.confirmButtonText;
      if (data.cancelButtonText) this.dialogData.cancelButtonText = data.cancelButtonText;
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
