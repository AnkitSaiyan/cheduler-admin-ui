import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
import { Appointment } from 'src/app/shared/models/appointment.model';
import { NotificationType, TableItem } from 'diflexmo-angular-design';

@Component({
  selector: 'dfm-unavailable-hall-periods',
  templateUrl: './unavailable-hall-periods.component.html',
  styleUrls: ['./unavailable-hall-periods.component.scss'],
})
export class UnavailableHallPeriodsComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public columns: string[] = ['Room Name', 'Started At', 'End', 'Absence Name'];

  private roomAbsence$$: BehaviorSubject<any[]>;

  public filteredRoomAbsence$$: BehaviorSubject<any[]>;

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  // public downloadItems: NameValue[] = [];

  // public recentPatients: any = [
  //   {
  //     roomName: 'Maaike',
  //     absenceName: 'Hannibal Smith',
  //     end: new Date(),
  //     getStarted: new Date(),
  //   },
  //   {
  //     roomName: 'Maaike',
  //     absenceName: 'Bannie Smith',
  //     end: new Date(),
  //     getStarted: new Date(),
  //   },
  //   {
  //     roomName: 'Maaike',
  //     absenceName: 'Kate Smith',
  //     end: new Date(),
  //     getStarted: new Date(),
  //   },
  //   {
  //     roomName: 'Maaike',
  //     absenceName: 'Hannibal Smith',
  //     end: new Date(),
  //     getStarted: new Date(),
  //   },
  //   {
  //     roomName: 'Maaike',
  //     absenceName: 'Hannibal Smith',
  //     end: new Date(),
  //     getStarted: new Date(),
  //   },
  //   {
  //     roomName: 'Maaike',
  //     absenceName: 'Hannibal Smith',
  //     end: new Date(),
  //     getStarted: new Date(),
  //   },
  //   {
  //     roomName: 'Maaike',
  //     absenceName: 'Hannibal Smith',
  //     end: new Date(),
  //     getStarted: new Date(),
  //   },
  // ];

  public clipboardData: string = '';

  public downloadItems: NameValue[] = [];

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
    this.roomAbsence$$ = new BehaviorSubject<any[]>([]);
    this.filteredRoomAbsence$$ = new BehaviorSubject<any[]>([]);
  }

  ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));
    this.dashboardApiService.roomAbsence$.pipe(takeUntil(this.destroy$$)).subscribe((roomAbsence) => {
      console.log(roomAbsence['roomAbsence']);
      this.roomAbsence$$.next(roomAbsence['roomAbsence']);
      this.filteredRoomAbsence$$.next(roomAbsence['roomAbsence']);
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
      if (searchText) {
        this.handleSearch(searchText.toLowerCase());
      } else {
        this.filteredRoomAbsence$$.next([...this.roomAbsence$$.value]);
      }
    });

    this.downloadDropdownControl.valueChanges
      .pipe(
        filter((value) => !!value),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => {
        if (!this.filteredRoomAbsence$$.value.length) {
          return;
        }

        this.downloadSvc.downloadJsonAs(
          value as DownloadAsType,
          this.columns.slice(0),
          this.filteredRoomAbsence$$.value.map((ap: any) => [
            ap?.roomName?.toString(),
            ap?.absenceName?.toString(),
            ap.startDate.toString(),
            ap.endDate.toString(),
          ]),
          'unavailable-hall-period',
        );

        if (value !== 'PRINT') {
          this.notificationSvc.showNotification(`${value} file downloaded successfully`);
        }

        this.downloadDropdownControl.setValue(null);

        this.cdr.detectChanges();
      });
  }

  private handleSearch(searchText: string): void {
    this.filteredRoomAbsence$$.next([
      ...this.roomAbsence$$.value.filter((appointment) => {
        return (
          appointment.roomName?.toLowerCase()?.includes(searchText) ||
          appointment.absenceName?.toLowerCase()?.includes(searchText) ||
          appointment.endDate?.toLowerCase()?.includes(searchText) ||
          appointment.startDate?.toString()?.includes(searchText)
        );
      }),
    ]);
  }

  public copyToClipboard() {
    try {
      let dataString = `Room Name\t\t\tStarted At\t\t\t`;
      dataString += `${this.columns.slice(2).join('\t\t')}\n`;

      this.filteredRoomAbsence$$.value.forEach((ap: any) => {
        dataString += `${ap?.roomName?.toString()}\t${ap?.startDate?.toString()}\t\t${ap.endDate.toString()}\t\t${ap.absenceName.toString()}\n`;
      });

      this.clipboardData = dataString;
      this.cdr.detectChanges();
      this.notificationSvc.showNotification('Data copied to clipboard successfully');
    } catch (e) {
      this.notificationSvc.showNotification('Failed to copy Data', NotificationType.DANGER);
      this.clipboardData = '';
    }
  }
}
