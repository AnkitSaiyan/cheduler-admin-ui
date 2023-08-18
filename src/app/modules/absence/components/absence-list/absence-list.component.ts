import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, filter, map } from 'rxjs';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { Permission } from 'src/app/shared/models/permission.model';
import { AddAbsenceComponent } from '../add-absence/add-absence.component';
import { ModalService } from 'src/app/core/services/modal.service';
import { ABSENCE_TYPE, ABSENCE_TYPE_ARRAY } from 'src/app/shared/utils/const';
import { DatePipe } from '@angular/common';

@Component({
	selector: 'dfm-absence-list',
	templateUrl: './absence-list.component.html',
	styleUrls: ['./absence-list.component.scss'],
})
export class AbsenceListComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public absenceViewType$!: Observable<'table' | 'calendar'>;

	public absenceType$!: Observable<(typeof ABSENCE_TYPE_ARRAY)[number]>;

	public readonly Permission = Permission;

	constructor(private route: ActivatedRoute, private router: Router, private modalSvc: ModalService, private datePipe: DatePipe) {
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

		this.absenceType$ = this.route.params.pipe(
			filter((params) => !!params[ABSENCE_TYPE]),
			map((params) => params[ABSENCE_TYPE]),
		);
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public openAddAbsenceModal(absenceType: (typeof ABSENCE_TYPE_ARRAY)[number]) {
		this.modalSvc.open(AddAbsenceComponent, {
			data: { absenceType },
			options: {
				size: 'xl',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
				keyboard: false,
			},
		});
	}

	public toggleView(isCalendarView: boolean): void {
		this.router.navigate([], {
			replaceUrl: true,
			queryParams: {
				v: isCalendarView ? 't' : 'w',
				d: this.datePipe.transform(new Date(), 'yyyy-MM-dd'),
			},
			queryParamsHandling: 'merge',
		});
	}
}
