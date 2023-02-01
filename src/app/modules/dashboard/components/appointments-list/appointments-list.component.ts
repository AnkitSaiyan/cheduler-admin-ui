import {Component, OnDestroy, OnInit} from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
  selector: 'dfm-appointments-list',
  templateUrl: './appointments-list.component.html',
  styleUrls: ['./appointments-list.component.scss'],
})
export class AppointmentsListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public columns: string[] = [
    'Get Started', 'End', 'Name', 'App. No', 'Read', 'Confirm', 'Actions'
  ];

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
      description: 'Download as Excel'
    },
    {
      name: 'PDF',
      value: 'pdf',
      description: 'Download as PDF'
    },
    {
      name: 'CSV',
      value: 'csv',
      description: 'Download as CSV'
    },
    {
      name: 'Print',
      value: 'print',
      description: 'Print appointments'
    }
  ]

  
  private appointments$$: BehaviorSubject<any[]>;

  public filteredAppointments$$: BehaviorSubject<any[]>;

  constructor(private dashboardApiService: DashboardApiService) {
    super();
    this.appointments$$ = new BehaviorSubject<any[]>([]);
    this.filteredAppointments$$ = new BehaviorSubject<any[]>([]);
  }

  public  ngOnInit() {

    
    this.dashboardApiService.appointment$.pipe(takeUntil(this.destroy$$)).subscribe((appointments) => {
      console.log('dashboard appointments: ', appointments);
      this.appointments$$.next(appointments);
      this.filteredAppointments$$.next(appointments);
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
}
