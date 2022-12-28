import { Component, OnInit } from '@angular/core';
import {TableItem} from "diflexmo-angular-design";

@Component({
  selector: 'dfm-appointments-list',
  templateUrl: './appointments-list.component.html',
  styleUrls: ['./appointments-list.component.scss']
})
export class AppointmentsListComponent implements OnInit {
  public columns: string[] = [
    'Get Started', 'End', 'Name', 'App. No', 'Read', 'Confirm', 'Actions'
  ];

  public appointments: any[] = [
    {
      getStarted: new Date(),
      end: new Date(),
      name: 'Maaike Benoit',
      applicationNo: 736,
      read: 'No',
      confirm: true,
    },
    {
      getStarted: new Date(),
      end: new Date(),
      name: 'Maaike Benoit',
      applicationNo: 736,
      read: 'No',
      confirm: true,
    },
    {
      getStarted: new Date(),
      end: new Date(),
      name: 'Maaike Benoit',
      applicationNo: 736,
      read: 'No',
      confirm: true,
    },
    {
      getStarted: new Date(),
      end: new Date(),
      name: 'Maaike Benoit',
      applicationNo: 736,
      read: 'No',
      confirm: true,
    },
    {
      getStarted: new Date(),
      end: new Date(),
      name: 'Maaike Benoit',
      applicationNo: 736,
      read: 'No',
      confirm: false,
    },
    {
      getStarted: new Date(),
      end: new Date(),
      name: 'Maaike Benoit',
      applicationNo: 736,
      read: 'No',
      confirm: true,
    },
    {
      getStarted: new Date(),
      end: new Date(),
      name: 'Maaike Benoit',
      applicationNo: 736,
      read: 'No',
      confirm: false,
    }
  ]
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

  constructor() { }

  public ngOnInit(): void {
  }

  public allSelected() {
    return false;
  }

  public handleChange($event: Event) {
    console.log($event, 'in');
  }
}
