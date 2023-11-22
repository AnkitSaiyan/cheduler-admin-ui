import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DashboardApiService } from 'src/app/core/services/dashboard-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
	selector: 'dfm-top-examinations',
	templateUrl: './top-examinations.component.html',
	styleUrls: ['./top-examinations.component.scss'],
})
export class TopExaminationsComponent extends DestroyableComponent implements OnInit, OnDestroy {
	private exams$$: BehaviorSubject<any[]>;

	public filteredExams$$: BehaviorSubject<any[]>;

	constructor(private dashboardApiService: DashboardApiService) {
		super();
		this.exams$$ = new BehaviorSubject<any[]>([]);
		this.filteredExams$$ = new BehaviorSubject<any[]>([]);
	}

	public ngOnInit(): void {
		this.dashboardApiService.exams$.pipe(takeUntil(this.destroy$$)).subscribe((exams) => {
			this.exams$$.next(exams.exams);
			this.filteredExams$$.next(exams.exams);
		});
	}
}
