import { Component, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
	selector: 'dfm-view-post',
	templateUrl: './view-post.component.html',
	styleUrls: ['./view-post.component.scss'],
})
export class ViewPostComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public dialogData = {
		titleText: 'Post It',
	};

	public postItData: any;

	constructor(private dialogSvc: ModalService, private dashboardApiService: DashboardApiService) {
		super();
	}

	public ngOnInit() {
		this.dialogSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data) => {
			if (data.titleText) this.dialogData.titleText = data.titleText;
		});

		this.dashboardApiService.posts$.pipe(takeUntil(this.destroy$$)).subscribe((posts) => {
			this.postItData = posts;
		});
	}

	public close() {
		this.dialogSvc.close();
	}
}
