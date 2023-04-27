import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, switchMap, take, takeUntil } from 'rxjs';
import { AbsenceApiService } from 'src/app/core/services/absence-api.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { Absence } from 'src/app/shared/models/absence.model';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { DatePipe } from '@angular/common';
import { NotificationType, TableItem } from 'diflexmo-angular-design-dev';

@Component({
  selector: 'dfm-employee-absences',
  templateUrl: './employee-absences.component.html',
  styleUrls: ['./employee-absences.component.scss'],
})
export class EmployeeAbsencesComponent extends DestroyableComponent implements OnInit, OnDestroy {
  private absences$$: BehaviorSubject<any[]>;

  public columns: string[] = ['Title', 'StartDate', 'EndDate', 'AbsenceInfo', 'Actions'];

  public filteredAbsence$$: BehaviorSubject<any[]>;

  public searchControl = new FormControl('', []);

  private selectedLang: string = ENG_BE;

  clipboardData: string = '';

  constructor(
    private absenceApiService: AbsenceApiService,
    private notificationSvc: NotificationDataService,
    private modalSvc: ModalService,
    private cdr: ChangeDetectorRef,
    private shareDataSvc: ShareDataService,
    private datePipe: DatePipe,
  ) {
    super();
    this.absences$$ = new BehaviorSubject<any[]>([]);
    this.filteredAbsence$$ = new BehaviorSubject<any[]>([]);
  }

  async ngOnInit(): Promise<void> {
    this.absenceApiService.absences$.pipe(takeUntil(this.destroy$$)).subscribe((employeeAbsences) => {
      this.absences$$.next(employeeAbsences);
      this.filteredAbsence$$.next(employeeAbsences);
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
      if (searchText) {
        this.handleSearch(searchText.toLowerCase());
      } else {
        this.filteredAbsence$$.next([...this.absences$$.value]);
      }
    });

    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => {
        this.selectedLang = lang;
        this.columns = [
          Translate.Title[lang],
          Translate.StartDate[lang],
          Translate.EndDate[lang],
          Translate.AbsenceInfo[lang],
          Translate.Actions[lang],
        ];
      });
  }

  public copyToClipboard() {
    try {
      let dataString = `${this.columns.slice(0, -1).join('\t')}\n`;

      this.filteredAbsence$$.value.forEach((absence: Absence) => {
        dataString += `${absence.name}\t${absence.startedAt}\t${absence.endedAt}\t${absence.info}\n`;
      });

      this.clipboardData = dataString;

      this.cdr.detectChanges();
      this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
    } catch (e) {
      this.notificationSvc.showNotification(Translate.ErrorMessage.CopyToClipboard[this.selectedLang], NotificationType.DANGER);
      this.clipboardData = '';
    }
  }

  private handleSearch(searchText: string): void {
    this.filteredAbsence$$.next([
      ...this.absences$$.value.filter((absence: Absence) => {
        return (
          absence.name?.toLowerCase()?.includes(searchText) ||
          this.datePipe.transform(absence.startedAt, 'dd/MM/yyyy, HH:mm')?.includes(searchText) ||
          this.datePipe.transform(absence.endedAt, 'dd/MM/yyyy, HH:mm')?.includes(searchText)
        );
      }),
    ]);
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }
}
