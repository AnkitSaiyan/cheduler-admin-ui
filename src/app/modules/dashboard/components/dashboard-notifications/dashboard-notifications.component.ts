import { Component, OnDestroy, OnInit } from '@angular/core';
import { DfmDatasource } from 'diflexmo-angular-design';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { PaginationData } from 'src/app/shared/models/base-response.model';

@Component({
	selector: 'dfm-dashboard-notifications',
	templateUrl: './dashboard-notifications.component.html',
	styleUrls: ['./dashboard-notifications.component.scss'],
})
export class DashboardNotificationsComponent extends DestroyableComponent implements OnInit, OnDestroy {
	private notifications$$: BehaviorSubject<any[]>;

	public filteredNotifications$$: BehaviorSubject<any[]>;

	private paginationData: PaginationData | undefined;

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

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
		this.filteredNotifications$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				this.tableData$$.next({
					items,
					isInitialLoading: false,
					isLoading: false,
					isLoadingMore: false,
				});
			},
		});

		this.notifications$$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (notifications) => this.filteredNotifications$$.next([...notifications]),
		});
		this.dashboardApiService.notification$.pipe(takeUntil(this.destroy$$)).subscribe((notificationsBase) => {
			if (this.paginationData && this.paginationData.pageNo < notificationsBase?.metaData?.pagination?.pageNo) {
				this.notifications$$.next([...this.notifications$$.value, ...notificationsBase.data]);
			} else {
				this.notifications$$.next(notificationsBase?.data);
			}
			this.paginationData = notificationsBase?.metaData?.pagination;
		});
	}

	public onScroll(): void {
		if (this.paginationData?.pageCount && this.paginationData?.pageNo && this.paginationData.pageCount > this.paginationData.pageNo) {
			this.dashboardApiService.notificationPageNo = this.dashboardApiService.notificationPageNo + 1;
		}
	}
}
