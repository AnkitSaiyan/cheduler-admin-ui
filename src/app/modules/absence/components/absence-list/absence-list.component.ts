import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, filter, map, takeUntil } from 'rxjs';
import { ModalService } from 'src/app/core/services/modal.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { Permission } from 'src/app/shared/models/permission.model';
import { ABSENCE_TYPE, ABSENCE_TYPE_ARRAY } from 'src/app/shared/utils/const';
import { AddAbsenceComponent } from '../add-absence/add-absence.component';

@Component({
	selector: 'dfm-absence-list',
	templateUrl: './absence-list.component.html',
	styleUrls: ['./absence-list.component.scss'],
})
export class AbsenceListComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public absenceViewType$!: Observable<'table' | 'calendar'>;

	public absenceType$!: Observable<(typeof ABSENCE_TYPE_ARRAY)[number]>;

	public readonly Permission = Permission;

	public selectedDate: Date | undefined = new Date();

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
		this.absenceType$ = this.route.data.pipe(
			filter((data) => !!data[ABSENCE_TYPE]),
			map((data) => data[ABSENCE_TYPE]),
		);

		this.absenceViewType$
			.pipe(takeUntil(this.destroy$$))
			.subscribe((res) =>
				(res == 'table' ? this.changeDate(undefined) : null)
			);
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public openAddAbsenceModal(absenceType: (typeof ABSENCE_TYPE_ARRAY)[number]) {
		this.modalSvc.open(AddAbsenceComponent, {
			data: { absenceType, selectedDate: this.selectedDate },
			options: {
				size: 'xl',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
				backdrop: false,
				windowClass: 'modal-backdrop-enable-click',
				keyboard: false,
			},
		});
	}

	public toggleView(isCalendarView: boolean): void {
		this.router.navigate([], {
			replaceUrl: true,
			queryParams: {
				v: isCalendarView ? 't' : 'm',
				d: this.datePipe.transform(new Date(), 'yyyy-MM-dd'),
			},
			queryParamsHandling: 'merge',
		});
	}

	public changeDate(date: Date | undefined) {
		this.selectedDate = date;
	}
}
