import { Component, OnDestroy, OnInit } from '@angular/core';
import { DfmDatasource } from 'diflexmo-angular-design';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { PaginationData } from 'src/app/shared/models/base-response.model';
import { Notification } from '../../../../shared/models/notification.model';

@Component({
	selector: 'dfm-dashboard-notifications',
	templateUrl: './dashboard-notifications.component.html',
	styleUrls: ['./dashboard-notifications.component.scss'],
})
export class DashboardNotificationsComponent extends DestroyableComponent implements OnInit, OnDestroy {
	private notifications$$: BehaviorSubject<Notification[]>;

	public filteredNotifications$$: BehaviorSubject<Notification[]>;

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	private paginationData: PaginationData | undefined;

	constructor(private dashboardApiService: DashboardApiService) {
		super();
		this.notifications$$ = new BehaviorSubject<any[]>([]);
		this.filteredNotifications$$ = new BehaviorSubject<any[]>([]);
		this.dashboardApiService.notificationPageNo = 1;
	}

	public ngOnInit(): void {
		this.filteredNotifications$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				this.tableData$$.next({
					items: items as any[],
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.notifications$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (notifications) => this.filteredNotifications$$.next([...notifications]),
		});

		this.dashboardApiService.notification$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (notificationsBase) => {
				if (this.paginationData && this.paginationData.pageNo < notificationsBase?.metaData?.pagination?.pageNo) {
					this.notifications$$.next([...this.notifications$$.value, ...notificationsBase.data]);
				} else {
					this.notifications$$.next(notificationsBase?.data);
				}
				this.paginationData = {...notificationsBase?.metaData?.pagination, lastDataLength: notificationsBase.data.length};
			},
		});
	}

	public onScroll(): void {
		if (this.paginationData?.pageSize && this.paginationData?.pageNo && this.paginationData.pageSize === this.paginationData.lastDataLength) {
			this.dashboardApiService.notificationPageNo += 1;
		}
	}
}
