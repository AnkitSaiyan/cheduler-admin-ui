import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, switchMap, take, takeUntil } from 'rxjs';
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { ConfirmActionModalComponent, DialogData } from 'src/app/shared/components/confirm-action-modal.component';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { ENG_BE } from 'src/app/shared/utils/const';
import { getReadStatusEnum } from 'src/app/shared/utils/getEnums';

@Component({
  selector: 'dfm-appointments-list',
  templateUrl: './appointments-list.component.html',
  styleUrls: ['./appointments-list.component.scss'],
})
export class AppointmentsListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public columns: string[] = ['Get Started', 'End', 'Name', 'App. No', 'Read', 'Confirm', 'Actions'];

  // public appointments: any[] = [
  //   {
  //     getStarted: new Date(),
  //     end: new Date(),
  //     name: 'Maaike Benoit',
  //     applicationNo: 736,
  //     read: 'No',
  //     confirm: true,
  //   },
  //   {
  //     getStarted: new Date(),
  //     end: new Date(),
  //     name: 'Maaike Benoit',
  //     applicationNo: 736,
  //     read: 'No',
  //     confirm: true,
  //   },
  //   {
  //     getStarted: new Date(),
  //     end: new Date(),
  //     name: 'Maaike Benoit',
  //     applicationNo: 736,
  //     read: 'No',
  //     confirm: true,
  //   },
  //   {
  //     getStarted: new Date(),
  //     end: new Date(),
  //     name: 'Maaike Benoit',
  //     applicationNo: 736,
  //     read: 'No',
  //     confirm: true,
  //   },
  //   {
  //     getStarted: new Date(),
  //     end: new Date(),
  //     name: 'Maaike Benoit',
  //     applicationNo: 736,
  //     read: 'No',
  //     confirm: false,
  //   },
  //   {
  //     getStarted: new Date(),
  //     end: new Date(),
  //     name: 'Maaike Benoit',
  //     applicationNo: 736,
  //     read: 'No',
  //     confirm: true,
  //   },
  //   {
  //     getStarted: new Date(),
  //     end: new Date(),
  //     name: 'Maaike Benoit',
  //     applicationNo: 736,
  //     read: 'No',
  //     confirm: false,
  //   },
  //   {
  //     getStarted: new Date(),
  //     end: new Date(),
  //     name: 'Maaike Benoit',
  //     applicationNo: 736,
  //     read: 'No',
  //     confirm: false,
  //   },
  //   {
  //     getStarted: new Date(),
  //     end: new Date(),
  //     name: 'Maaike Benoit',
  //     applicationNo: 736,
  //     read: 'No',
  //     confirm: false,
  //   },
  //   {
  //     getStarted: new Date(),
  //     end: new Date(),
  //     name: 'Maaike Benoit',
  //     applicationNo: 736,
  //     read: 'No',
  //     confirm: false,
  //   },
  //   {
  //     getStarted: new Date(),
  //     end: new Date(),
  //     name: 'Maaike Benoit',
  //     applicationNo: 736,
  //     read: 'No',
  //     confirm: false,
  //   }
  // ]
  public downloadItems: any[] = [
    {
      name: 'Excel',
      value: 'xls',
      description: 'Download as Excel',
    },
    {
      name: 'PDF',
      value: 'pdf',
      description: 'Download as PDF',
    },
    {
      name: 'CSV',
      value: 'csv',
      description: 'Download as CSV',
    },
    {
      name: 'Print',
      value: 'print',
      description: 'Print appointments',
    },
  ];

  private appointments$$: BehaviorSubject<any[]>;

  public filteredAppointments$$: BehaviorSubject<any[]>;

  public searchControl = new FormControl('', []);

  public readStatus = getReadStatusEnum();

  constructor(
    private dashboardApiService: DashboardApiService,
    private appointmentApiSvc: AppointmentApiService,
    private modalSvc: ModalService,
    private notificationSvc: NotificationDataService,
    private shareDataService: ShareDataService
  ) {
    super();
    this.appointments$$ = new BehaviorSubject<any[]>([]);
    this.filteredAppointments$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit() {
    this.dashboardApiService.appointment$.pipe(takeUntil(this.destroy$$)).subscribe((appointments) => {
      console.log('dashboard appointments: ', appointments);
      this.appointments$$.next(appointments);
      this.filteredAppointments$$.next(appointments);
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
      console.log('searchText: ', searchText);
      if (searchText) {
        this.handleSearch(searchText.toLowerCase());
      } else {
        this.filteredAppointments$$.next([...this.appointments$$.value]);
      }
    });
  }

  public allSelected() {
    return false;
  }

  public handleChange($event: Event) {
    console.log($event, 'in');
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  private handleSearch(searchText: string): void {
    this.filteredAppointments$$.next([
      ...this.appointments$$.value.filter((appointment) => {
        return (
          appointment.patientFname?.toLowerCase()?.includes(searchText) ||
          appointment.patientLname?.toLowerCase()?.includes(searchText) ||
          appointment.id?.toString()?.includes(searchText)
        );
      }),
    ]);
  }

  public deleteAppointment(id: number) {
    console.log('id: ', id);
    const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'AreYouSureWantToDeleteAppointment',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    dialogRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => this.appointmentApiSvc.deleteAppointment$(id)),
        take(1),
      )
      .subscribe((response) => {
        console.log('response: ', response);
        if (response) {
          this.shareDataService.getLanguage$().subscribe((language: string)=>{
            this.notificationSvc.showNotification(language === ENG_BE? 'Appointment deleted successfully': 'Afspraak succesvol Verwijderd!');
          })
        }
      });
  }
}
