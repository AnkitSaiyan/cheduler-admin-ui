import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dfm-unavailable-hall-periods',
  templateUrl: './unavailable-hall-periods.component.html',
  styleUrls: ['./unavailable-hall-periods.component.scss']
})
export class UnavailableHallPeriodsComponent implements OnInit {
  public columns: string[] = ['Room Name', 'Get Started', 'End', 'Absence Name'];

  public recentPatients: any = [
    {
      roomName: 'Maaike',
      absenceName: 'Hannibal Smith',
      end: new Date(),
      getStarted: new Date(),
    },
    {
      roomName: 'Maaike',
      absenceName: 'Bannie Smith',
      end: new Date(),
      getStarted: new Date(),
    },
    {
      roomName: 'Maaike',
      absenceName: 'Kate Smith',
      end: new Date(),
      getStarted: new Date(),
    },
    {
      roomName: 'Maaike',
      absenceName: 'Hannibal Smith',
      end: new Date(),
      getStarted: new Date(),
    },
    {
      roomName: 'Maaike',
      absenceName: 'Hannibal Smith',
      end: new Date(),
      getStarted: new Date(),
    },
    {
      roomName: 'Maaike',
      absenceName: 'Hannibal Smith',
      end: new Date(),
      getStarted: new Date(),
    },
    {
      roomName: 'Maaike',
      absenceName: 'Hannibal Smith',
      end: new Date(),
      getStarted: new Date(),
    },
  ];

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
  ngOnInit(): void {
  }

}
