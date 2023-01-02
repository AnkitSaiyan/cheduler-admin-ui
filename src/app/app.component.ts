import { Component, OnInit } from '@angular/core';
import { Tooltip } from 'bootstrap';

@Component({
  selector: 'dfm-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((e) => new Tooltip(e));
  }
}
