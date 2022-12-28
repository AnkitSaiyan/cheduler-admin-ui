import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dfm-upcoming-appointments',
  templateUrl: './upcoming-appointments.component.html',
  styleUrls: ['./upcoming-appointments.component.scss']
})
export class UpcomingAppointmentsComponent implements OnInit {

  public upcomingAppointmentCount: number = 16;

  public upcomingAppointments: any[] = [
    {
      name: 'Angela Bower',
      time: (new Date()).setHours((new Date()).getHours() + 0.5),
      roomNo: 2,
      post: 'Pathologist',
      avatar: ''
    },
    {
      name: 'Angela Bower',
      time: (new Date()).setHours((new Date()).getHours() + 0.5),
      roomNo: 4,
      post: 'Pathologist',
      avatar: ''
    },
    {
      name: 'Murdock',
      time: (new Date()).setHours((new Date()).getHours() + 0.5),
      roomNo: 3,
      post: 'Surgeon',
      avatar: ''
    },
    {
      name: 'April Curtis',
      time: (new Date()).setHours((new Date()).getHours() + 0.5),
      roomNo: 11,
      post: 'Cardiologist',
      avatar: ''
    },
    {
      name: 'Lorem',
      time: (new Date()).setHours((new Date()).getHours() + 0.5),
      roomNo: 8,
      post: 'Neurologist',
      avatar: ''
    }
  ]
  constructor() { }

  ngOnInit(): void {
  }

}
