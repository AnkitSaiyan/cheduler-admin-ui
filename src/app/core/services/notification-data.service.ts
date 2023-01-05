import { Injectable } from '@angular/core';
import { NotificationService, NotificationType } from 'diflexmo-angular-design';

@Injectable({
  providedIn: 'root',
})
export class NotificationDataService {
  constructor(private notificationSvc: NotificationService) {}

  public showNotification(message: string, type = NotificationType.SUCCESS, headerText = '', sticky = false) {
    this.notificationSvc.addNotification({
      type,
      bodyText: message,
      headerText,
      sticky,
    });
  }
}
