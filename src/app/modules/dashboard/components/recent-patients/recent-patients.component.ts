import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dfm-recent-patients',
  templateUrl: './recent-patients.component.html',
  styleUrls: ['./recent-patients.component.scss'],
})
export class RecentPatientsComponent implements OnInit {
  public columns: string[] = ['Patient Name', 'Email ID', 'Doctor', 'Appointment Date', 'Actions'];

  public recentPatients: any = [
    {
      patientName: 'Maaike',
      emailId: 'maaike@diflexmo.be',
      doctor: 'Hannibal Smith',
      appointmentDate: new Date(),
      avatar: '',
    },
    {
      patientName: 'Maaike',
      emailId: 'maaike@diflexmo.be',
      doctor: 'Bannie Smith',
      appointmentDate: new Date(),
      avatar: '',
    },
    {
      patientName: 'Maaike',
      emailId: 'maaike@diflexmo.be',
      doctor: 'Kate Smith',
      appointmentDate: new Date(),
      avatar: '',
    },
    {
      patientName: 'Maaike',
      emailId: 'maaike@diflexmo.be',
      doctor: 'Hannibal Smith',
      appointmentDate: new Date(),
      avatar: '',
    },
    {
      patientName: 'Maaike',
      emailId: 'maaike@diflexmo.be',
      doctor: 'Hannibal Smith',
      appointmentDate: new Date(),
      avatar: '',
    },
    {
      patientName: 'Maaike',
      emailId: 'maaike@diflexmo.be',
      doctor: 'Hannibal Smith',
      appointmentDate: new Date(),
      avatar: '',
    },
    {
      patientName: 'Maaike',
      emailId: 'maaike@diflexmo.be',
      doctor: 'Hannibal Smith',
      appointmentDate: new Date(),
      avatar: '',
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

  constructor() {}

  public ngOnInit(): void {}
}
