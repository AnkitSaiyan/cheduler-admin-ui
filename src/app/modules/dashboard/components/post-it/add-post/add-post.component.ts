import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { ModalService } from 'src/app/core/services/modal.service';
import { ConfirmActionModalData } from 'src/app/shared/components/confirm-action-modal.component';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
  selector: 'dfm-add-post',
  templateUrl: './add-post.component.html',
  styleUrls: ['./add-post.component.scss'],
})
export class AddPostComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public dialogData: ConfirmActionModalData = {
    confirmButtonText: 'Proceed',
    cancelButtonText: 'Cancel',
    titleText: 'PostIt',
    bodyText: 'Are you sure you want to perform this action?',
  };

  postItMessage = new FormControl('', []);

  constructor(private dialogSvc: ModalService) {
    super();
  }

  public ngOnInit() {
    this.dialogSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data: ConfirmActionModalData) => {
      if (data.bodyText) this.dialogData.bodyText = data.bodyText;
      if (this.postItMessage.value) this.dialogData.titleText = this.postItMessage.value;
      if (data.confirmButtonText) this.dialogData.confirmButtonText = data.confirmButtonText;
      if (data.cancelButtonText) this.dialogData.cancelButtonText = data.cancelButtonText;
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public close(result: boolean) {
    this.dialogSvc.close(this.postItMessage.value);
  }
}

