import { Component, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { ModalService } from '../../../../core/services/modal.service';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { UserApiService } from '../../../../core/services/user-api.service';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';

@Component({
  selector: 'dfm-change-radiologist-modal',
  templateUrl: './change-radiologist-modal.component.html',
  styleUrls: ['./change-radiologist-modal.component.scss'],
})
export class ChangeRadiologistModalComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public radiologistFormControl = new FormControl('', [Validators.required]);

  public radiologists: NameValue[] = [];

  constructor(private dialogSvc: ModalService, private staffApiSvc: StaffApiService) {
    super();
  }

  public ngOnInit(): void {
    this.staffApiSvc.radiologists$.pipe(takeUntil(this.destroy$$)).subscribe((radiologists) => {
      radiologists.forEach(({ id, firstname, lastname }) =>
        this.radiologists.push({
          name: `${firstname} ${lastname}`,
          value: id.toString(),
        }),
      );
    });
  }

  public close(result: boolean) {
    if (result && this.radiologistFormControl.invalid) {
      return;
    }

    this.dialogSvc.close(this.radiologistFormControl.value);
  }
}
