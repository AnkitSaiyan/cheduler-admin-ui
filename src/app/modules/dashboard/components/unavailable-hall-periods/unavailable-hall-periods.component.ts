import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
  selector: 'dfm-unavailable-hall-periods',
  templateUrl: './unavailable-hall-periods.component.html',
  styleUrls: ['./unavailable-hall-periods.component.scss']
})
export class UnavailableHallPeriodsComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public columns: string[] = ['RoomName', 'GetStarted', 'End', 'AbsenceName'];

    
  private roomAbsence$$: BehaviorSubject<any[]>;

  public filteredRoomAbsence$$: BehaviorSubject<any[]>;

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
  ];

  constructor(private dashboardApiService: DashboardApiService) {
    super();
    this.roomAbsence$$ = new BehaviorSubject<any[]>([]);
    this.filteredRoomAbsence$$ = new BehaviorSubject<any[]>([]);
  }

  
  ngOnInit(): void {
        
    this.dashboardApiService.roomAbsence$.pipe(takeUntil(this.destroy$$)).subscribe((roomAbsence) => {
      this.roomAbsence$$.next(roomAbsence['roomAbsence']);
      this.filteredRoomAbsence$$.next(roomAbsence['roomAbsence']);
    });
  }

}
