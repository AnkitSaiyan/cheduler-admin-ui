import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ABSENCE_ID } from '../../../../shared/utils/const';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { Absence, RepeatType } from '../../../../shared/models/absence.model';
import { AbsenceApiService } from '../../../../core/services/absence-api.service';
import { AddAbsenceComponent } from '../add-absence/add-absence.component';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';

@Component({
  selector: 'dfm-view-absence',
  templateUrl: './view-absence.component.html',
  styleUrls: ['./view-absence.component.scss'],
})
export class ViewAbsenceComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public absenceDetails$$ = new BehaviorSubject<Absence | undefined>(undefined);

  public repeatType = RepeatType;

  private selectedLang: string = ENG_BE;


  constructor(
    private absenceApiSvc: AbsenceApiService,
    private routerStateSvc: RouterStateService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private modalSvc: ModalService,
    private shareDataService: ShareDataService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.routerStateSvc
      .listenForParamChange$(ABSENCE_ID)
      .pipe(
        switchMap((absenceID) => this.absenceApiSvc.getAbsenceByID$(+absenceID)),
        takeUntil(this.destroy$$),
      )
      .subscribe((absenceDetails) => {
        this.absenceDetails$$.next(absenceDetails);
        console.log(absenceDetails);
      });

      this.shareDataService
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => (this.selectedLang = lang));
  }

  public deleteAbsence(id: number) {
    console.log('id: ', id);
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'AreyousureyouwanttodeletethisAbsence',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    modalRef.closed
      .pipe(
        filter((res: boolean) => {
          console.log('res', res);
          return res;
        }),
        switchMap(() => this.absenceApiSvc.deleteAbsence$(id)),
        take(1),
      )
      .subscribe(() => {
        this.notificationSvc.showNotification(Translate.SuccessMessage.Deleted[this.selectedLang]);
        this.router.navigate(['/', 'absence']);
      });
  }

  public openEditAbsenceModal() {
    this.modalSvc.open(AddAbsenceComponent, {
      data: { edit: !!this.absenceDetails$$.value?.id, absenceID: this.absenceDetails$$.value?.id },
      options: {
        size: 'xl',
        centered: true,
        backdropClass: 'modal-backdrop-remove-mv',
        keyboard: false,
      },
    });
  }
}
