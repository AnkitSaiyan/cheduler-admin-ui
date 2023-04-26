import {Injectable} from '@angular/core';
import { NotificationService, NotificationType } from 'diflexmo-angular-design-dev';

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

  public showSuccess(message: string) {
    this.notificationSvc.addNotification({
      bodyText: message,
      type: NotificationType.SUCCESS,
      headerText: '',
      sticky: false
    });
  }

  public showError(message: string) {
    this.notificationSvc.addNotification({
      bodyText: message,
      type: NotificationType.DANGER,
      headerText: '',
      sticky: false
    });
  }

  public showWarning(message: string) {
    this.notificationSvc.addNotification({
      bodyText: message,
      type: NotificationType.WARNING,
      headerText: '',
      sticky: false
    });
  }
}
