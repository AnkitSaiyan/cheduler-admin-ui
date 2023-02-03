import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
  selector: 'dfm-dashboard-notifications',
  templateUrl: './dashboard-notifications.component.html',
  styleUrls: ['./dashboard-notifications.component.scss'],
})
export class DashboardNotificationsComponent extends DestroyableComponent implements OnInit, OnDestroy {
  
  private notifications$$: BehaviorSubject<any[]>;

  public filteredNotifications$$: BehaviorSubject<any[]>;

  // public notifications = [
  //   {
  //     name: 'Angela Bower',
  //     post: 'Staff',
  //     message: 'Reported time-off leave on 06.12.2022',
  //     date: new Date().setHours(new Date().getHours() - 1),
  //   },
  //   {
  //     name: 'Thomas Magnum',
  //     post: 'Patients',
  //     message: 'Cancelled today’s appointment',
  //     date: new Date().setHours(new Date().getHours() - 1),
  //   },
  //   {
  //     name: 'Sledge Hammer',
  //     post: 'General users',
  //     message: 'Have been added to general users',
  //     date: new Date().setHours(new Date().getHours() - 1),
  //   },
  //   {
  //     name: 'Sledge Hammer',
  //     post: 'General users',
  //     message: 'Have been added to general users',
  //     date: new Date().setHours(new Date().getHours() - 1),
  //   },
  //   {
  //     name: 'Sledge Hammer',
  //     post: 'General users',
  //     message: 'Have been added to general users',
  //     date: new Date().setHours(new Date().getHours() - 1),
  //   },
  //   {
  //     name: 'Sledge Hammer',
  //     post: 'General users',
  //     message: 'Have been added to general users',
  //     date: new Date().setHours(new Date().getHours() - 1),
  //   },
  //   {
  //     name: 'Sledge Hammer',
  //     post: 'General users',
  //     message: 'Have been added to general users',
  //     date: new Date().setHours(new Date().getHours() - 1),
  //   },
  // ];

  constructor(private dashboardApiService: DashboardApiService) {
    super();
    this.notifications$$ = new BehaviorSubject<any[]>([]);
    this.filteredNotifications$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
    this.dashboardApiService.notification$.pipe(takeUntil(this.destroy$$)).subscribe((notifications) => {
      console.log('notifications: ', notifications['notifications']);
      this.notifications$$.next(notifications['notifications']);
      this.filteredNotifications$$.next(notifications['notifications']);
    });

  }
}
