import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, filter, map } from 'rxjs';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
	selector: 'dfm-absence-list',
	templateUrl: './absence-list.component.html',
	styleUrls: ['./absence-list.component.scss'],
})
export class AbsenceListComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public absenceViewType$!: Observable<'table' | 'calendar'>;
	constructor(private route: ActivatedRoute) {
		super();
	}

	public ngOnInit(): void {
		this.absenceViewType$ = this.route.queryParams.pipe(
			filter((queryParams) => !!queryParams['v']),
			map((queryParams) => {
				if (queryParams['v'] === 't') {
					return 'table';
				}
				return 'calendar';
			}),
		);
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}
}
