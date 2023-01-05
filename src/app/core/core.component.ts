import { Component, OnInit } from '@angular/core';
import { NotificationService } from 'diflexmo-angular-design';

@Component({
  selector: 'dfm-main',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss'],
})
export class CoreComponent implements OnInit {
  constructor(private notificationSvc: NotificationService) {}

  ngOnInit(): void {}
}
