import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dfm-employee-absences',
  templateUrl: './employee-absences.component.html',
  styleUrls: ['./employee-absences.component.scss'],
})
export class EmployeeAbsencesComponent implements OnInit {
  public employeeAbsences = [
    {
      name: 'Templeton Pack',
      post: 'Radiologist',
      fromDate: (new Date).setDate((new Date().getDate() - 2)),
      toDate: (new Date).setDate((new Date().getDate() - 1)),
      avatar: '',
    },
    {
      name: 'Kate Tanner',
      post: 'Cardiologist',
      fromDate: (new Date).setDate((new Date().getDate() - 2)),
      toDate: (new Date).setDate((new Date().getDate() - 1)),
      avatar: '',
    },
    {
      name: 'Dori Doreau',
      post: 'Physician',
      fromDate: (new Date).setDate((new Date().getDate() - 2)),
      toDate: (new Date).setDate((new Date().getDate() - 1)),
      avatar: '',
    },
    {
      name: 'Dr. Bonnie Barstow',
      post: 'Surgeon',
      fromDate: (new Date).setDate((new Date().getDate() - 2)),
      toDate: (new Date).setDate((new Date().getDate() - 1)),
      avatar: '',
    },
    {
      name: 'Templeton Pack',
      post: 'Cardiologist',
      fromDate: (new Date).setDate((new Date().getDate() - 2)),
      toDate: (new Date).setDate((new Date().getDate() - 1)),
      avatar: '',
    },
    {
      name: 'Templeton Pack',
      post: 'Cardiologist',
      fromDate: (new Date).setDate((new Date().getDate() - 2)),
      toDate: (new Date).setDate((new Date().getDate() - 1)),
      avatar: '',
    },
    {
      name: 'Templeton Pack',
      post: 'Cardiologist',
      fromDate: (new Date).setDate((new Date().getDate() - 2)),
      toDate: (new Date).setDate((new Date().getDate() - 1)),
      avatar: '',
    },
    {
      name: 'Templeton Pack',
      post: 'Cardiologist',
      fromDate: (new Date).setDate((new Date().getDate() - 2)),
      toDate: (new Date).setDate((new Date().getDate() - 1)),
      avatar: '',
    },
    {
      name: 'Templeton Pack',
      post: 'Cardiologist',
      fromDate: (new Date).setDate((new Date().getDate() - 2)),
      toDate: (new Date).setDate((new Date().getDate() - 1)),
      avatar: '',
    },
  ];

  constructor() {}

  ngOnInit(): void {}
}
