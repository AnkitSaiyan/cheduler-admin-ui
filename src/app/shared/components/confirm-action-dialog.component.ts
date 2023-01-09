import { Component, OnDestroy, OnInit } from '@angular/core';
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
  selector: 'dfm-confirm-action-dialog',
  template: `
    <div #content class="">
      <div class="modal-header">
        <h5 class="modal-title">{{ dialogData.titleText }}</h5>
        <dfm-button-icon color="tertiary-gray" icon="x-close" (click)="close(false)"></dfm-button-icon>
      </div>

      <div class="modal-body">
        <p class="dfm-m-0">{{ dialogData.bodyText }}</p>
      </div>

      <div class="modal-footer">
        <dfm-button color="secondary" size="md" (click)="close(false)">{{ dialogData.cancelButtonText }}</dfm-button>
        <dfm-button color="primary" size="md" (click)="close(true)">{{ dialogData.confirmButtonText }}</dfm-button>
      </div>
    </div>
  `,
  styles: [
    `
      @media (max-width: 680px) {
        dfm-button {
          height: 44px;
          flex: 1;
        }
      }
    `,
  ],
})
export class ConfirmActionDialogComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public dialogData: DialogData = {
    confirmButtonText: 'Proceed',
    cancelButtonText: 'Cancel',
    titleText: 'Confirmation',
    bodyText: 'Are you sure you want to perform this action?',
  };

  constructor(private dialogSvc: ModalService) {
    super();
  }

  public ngOnInit() {
    this.dialogSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data: DialogData) => {
      this.dialogData = data;
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public close(result: boolean) {
    this.dialogSvc.close(result);
  }
}
