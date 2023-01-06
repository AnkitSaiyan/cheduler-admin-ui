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
        <h4 class="modal-title">{{ dialogData.titleText }}</h4>
        <dfm-button-icon color="tertiary-gray" icon="x-close" (click)="dismiss()"></dfm-button-icon>
      </div>

      <div class="modal-body">
        <p>{{ dialogData.bodyText }}</p>
      </div>

      <div class="modal-footer">
        <dfm-button color="secondary" size="sm" (click)="dismiss()">{{ dialogData.cancelButtonText }}</dfm-button>
        <dfm-button color="primary" size="sm" (click)="confirm()">{{ dialogData.confirmButtonText }}</dfm-button>
      </div>
    </div>
  `,
  styles: [``],
})
export class ConfirmActionDialogComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public dialogData: DialogData = {
    confirmButtonText: 'Confirm',
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

  public dismiss() {
    this.dialogSvc.dismiss();
  }

  public confirm() {
    this.dialogSvc.close(true);
  }
}
