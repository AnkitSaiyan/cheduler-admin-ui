import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dfm-dashboard-notifications',
  templateUrl: './dashboard-notifications.component.html',
  styleUrls: ['./dashboard-notifications.component.scss'],
})
export class DashboardNotificationsComponent implements OnInit {
  public notifications = [
    {
      name: 'Angela Bower',
      post: 'Staff',
      message: 'Reported time-off leave on 06.12.2022',
      date: new Date().setHours(new Date().getHours() - 1),
    },
    {
      name: 'Thomas Magnum',
      post: 'Patients',
      message: 'Cancelled today’s appointment',
      date: new Date().setHours(new Date().getHours() - 1),
    },
    {
      name: 'Sledge Hammer',
      post: 'General users',
      message: 'Have been added to general users',
      date: new Date().setHours(new Date().getHours() - 1),
    },
    {
      name: 'Sledge Hammer',
      post: 'General users',
      message: 'Have been added to general users',
      date: new Date().setHours(new Date().getHours() - 1),
    },
    {
      name: 'Sledge Hammer',
      post: 'General users',
      message: 'Have been added to general users',
      date: new Date().setHours(new Date().getHours() - 1),
    },
    {
      name: 'Sledge Hammer',
      post: 'General users',
      message: 'Have been added to general users',
      date: new Date().setHours(new Date().getHours() - 1),
    },
    {
      name: 'Sledge Hammer',
      post: 'General users',
      message: 'Have been added to general users',
      date: new Date().setHours(new Date().getHours() - 1),
    },
  ];

  public ngOnInit(): void {}
}
