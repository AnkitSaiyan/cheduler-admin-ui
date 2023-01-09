import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap/modal/modal-config';
import { BehaviorSubject, Observable } from 'rxjs';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap/modal/modal-ref';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private dialogData$$ = new BehaviorSubject<any>(null);

  private dialogRef!: NgbModalRef;

  constructor(private ngbModal: NgbModal) {}

  public open(dialogBox: any, extras: { options?: NgbModalOptions; data?: any }): NgbModalRef {
    if (extras?.data) {
      this.dialogData$$.next(extras.data);
    }
    this.dialogRef = this.ngbModal.open(dialogBox, extras?.options ?? { centered: true });
    return this.dialogRef;
  }

  public dismiss() {
    this.dialogRef.dismiss();
  }

  public close(data?: any) {
    this.dialogRef.close(data);
  }

  public get dialogData$(): Observable<any> {
    return this.dialogData$$.asObservable();
  }
}
