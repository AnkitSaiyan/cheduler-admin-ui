import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dfm-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  public handleClick() {
    document.querySelector('#top')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
}
