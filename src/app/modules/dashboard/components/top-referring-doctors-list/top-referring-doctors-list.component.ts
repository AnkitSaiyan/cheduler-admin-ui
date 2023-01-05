import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dfm-top-referring-doctors-list',
  templateUrl: './top-referring-doctors-list.component.html',
  styleUrls: ['./top-referring-doctors-list.component.scss'],
})
export class TopReferringDoctorsListComponent implements OnInit {
  public top10Doctors = [
    {
      name: 'Templeton Pack',
      post: 'Radiologist',
      avatar: '',
    },
    {
      name: 'Kate Tanner',
      post: 'Cardiologist',
      avatar: '',
    },
    {
      name: 'Dori Doreau',
      post: 'Physician',
      avatar: '',
    },
    {
      name: 'Dr. Bonnie Barstow',
      post: 'Surgeon',
      avatar: '',
    },
    {
      name: 'Templeton Pack',
      post: 'Cardiologist',
      avatar: '',
    },
    {
      name: 'Templeton Pack',
      post: 'Cardiologist',
      avatar: '',
    },
    {
      name: 'Templeton Pack',
      post: 'Cardiologist',
      avatar: '',
    },
  ];
  public ngOnInit(): void {}
}
