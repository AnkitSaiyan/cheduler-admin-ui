import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, debounceTime, filter, groupBy, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DownloadAsType, DownloadService } from 'src/app/core/services/download.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { RoomsApiService } from 'src/app/core/services/rooms-api.service';
import { RouterStateService } from 'src/app/core/services/router-state.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { NameValue } from 'src/app/shared/components/search-modal.component';
import { NotificationType, TableItem } from 'diflexmo-angular-design';
import { Translate } from 'src/app/shared/models/translate.model';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from 'src/app/shared/utils/const';

@Component({
  selector: 'dfm-recent-patients',
  templateUrl: './recent-patients.component.html',
  styleUrls: ['./recent-patients.component.scss'],
})
export class RecentPatientsComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public columns: string[] = ['PatientName', 'Email ID', 'Doctor', 'AppointmentDate'];

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);
  private selectedLang: string = ENG_BE;

  public statuses = Statuses;

  // public downloadItems: NameValue[] = [];

  // public recentPatients: any = [
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Hannibal Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Bannie Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Kate Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Hannibal Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Hannibal Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Hannibal Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  //   {
  //     patientName: 'Maaike',
  //     emailId: 'maaike@diflexmo.be',
  //     doctor: 'Hannibal Smith',
  //     appointmentDate: new Date(),
  //     avatar: '',
  //   },
  // ];

  // public downloadItems: any[] = [
  //   {
  //     name: 'Excel',
  //     value: 'xls',
  //     description: 'Download as Excel',
  //   },
  //   {
  //     name: 'PDF',
  //     value: 'pdf',
  //     description: 'Download as PDF',
  //   },
  //   {
  //     name: 'CSV',
  //     value: 'csv',
  //     description: 'Download as CSV',
  //   },
  //   {
  //     name: 'Print',
  //     value: 'print',
  //     description: 'Print appointments',
  //   },
  // ];

  public downloadItems: NameValue[] = [];

  public clipboardData: string = '';

  private recentPatients$$: BehaviorSubject<any[]>;

  public filteredRecentPatients$$: BehaviorSubject<any[]>;

  constructor(
    private dashboardApiService: DashboardApiService,
    private downloadSvc: DownloadService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private roomApiSvc: RoomsApiService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private titleCasePipe: TitleCasePipe,
    private routerStateSvc: RouterStateService,
    private shareDataSvc: ShareDataService,
  ) {
    super();
    this.recentPatients$$ = new BehaviorSubject<any[]>([]);
    this.filteredRecentPatients$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));
    this.dashboardApiService.recentPatient$.pipe(takeUntil(this.destroy$$)).subscribe((recentPatient) => {
      this.recentPatients$$.next(recentPatient);
      this.filteredRecentPatients$$.next(recentPatient);
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
      if (searchText) {
        this.handleSearch(searchText.toLowerCase());
      } else {
        this.filteredRecentPatients$$.next([...this.recentPatients$$.value]);
      }
    });

    this.downloadDropdownControl.valueChanges
      .pipe(
        filter((value) => !!value),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => {
        if (!this.filteredRecentPatients$$.value.length) {
          return;
        }

        this.downloadSvc.downloadJsonAs(
          value as DownloadAsType,
          this.columns.slice(0),
          this.filteredRecentPatients$$.value.map((ap: any) => [
            ap?.patientFname?.toString(),
            ap?.patientEmail?.toString(),
            ap?.doctor.toString(),
            ap.startedAt.toString(),
          ]),
          'recent-patients',
        );

        if (value !== 'PRINT') {
          this.notificationSvc.showNotification(`${Translate.DownloadSuccess(value)[this.selectedLang]}`);
        }

        this.downloadDropdownControl.setValue(null);

        this.cdr.detectChanges();
      });
      this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => {
        this.selectedLang = lang;
        this.columns = [
          // Translate.Read[lang],
          Translate.Status[lang],
          Translate.Actions[lang],
        ];

        // eslint-disable-next-line default-case
        switch (lang) {
          case ENG_BE:
            this.statuses = Statuses;
            break;
          case DUTCH_BE:
            this.statuses = StatusesNL;
            break;
        }
      });
  }

  private handleSearch(searchText: string): void {
    this.filteredRecentPatients$$.next([
      ...this.recentPatients$$.value.filter((appointment) => {
        return (
          appointment.patientFname?.toLowerCase()?.includes(searchText) ||
          appointment.patientEmail?.toLowerCase()?.includes(searchText) ||
          appointment.doctor?.toLowerCase()?.includes(searchText) ||
          appointment.startedAt?.toString()?.includes(searchText)
        );
      }),
    ]);
  }

  public copyToClipboard() {
    try {
      let dataString = `Patient Name\t\t\tEmail Id\t\t\t`;
      dataString += `${this.columns.slice(2).join('\t\t')}\n`;

      this.filteredRecentPatients$$.value.forEach((ap: any) => {
        dataString += `${ap?.patientFname?.toString()}\t${ap?.patientEmail?.toString()}\t\t${ap.doctor.toString()}\t\t${ap.startedAt.toString()}\n`;
      });

      this.clipboardData = dataString;
      this.cdr.detectChanges();
      this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
    } catch (e) {
      this.notificationSvc.showNotification(Translate.ErrorMessage.FailedToCopyData[this.selectedLang], NotificationType.DANGER);
      this.clipboardData = '';
    }
  }

  public deletePatient(id: number) {
  }
}
