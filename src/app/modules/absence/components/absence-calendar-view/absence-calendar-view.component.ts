import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, map, skip, switchMap, takeUntil } from 'rxjs';
import { AbsenceApiService } from 'src/app/core/services/absence-api.service';
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { NameValue } from 'src/app/shared/components/search-modal.component';
import { ABSENCE_TYPE } from 'src/app/shared/utils/const';
import { DateTimeUtils } from 'src/app/shared/utils/date-time.utils';

@Component({
	selector: 'dfm-absence-calendar-view',
	templateUrl: './absence-calendar-view.component.html',
	styleUrls: ['./absence-calendar-view.component.scss'],
})
export class AbsenceCalendarViewComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public calendarViewFormControl = new FormControl();

	public dataControl = new FormControl();

	public calendarViewType: NameValue[] = [];

	public selectedDate$$ = new BehaviorSubject<Date>(new Date());

	public changeMonth$$ = new BehaviorSubject<number>(0);

	public changeWeek$$ = new BehaviorSubject<number>(0);

	public changeDate$$ = new BehaviorSubject<number>(0);

	public newDate$$ = new BehaviorSubject<{ date: Date | null; isWeekChange: boolean }>({ date: null, isWeekChange: false });

	private paramsToCalendarView = {
		m: 'month',
		w: 'week',
		d: 'day',
	};

	private calendarViewToParam = {
		month: 'm',
		week: 'w',
		day: 'd',
	};

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private datePipe: DatePipe,
		private appointmentApiSvc: AppointmentApiService,
		private absenceApiSvc: AbsenceApiService,
	) {
		super();
		this.appointmentApiSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => {
				this.calendarViewType = items;
			},
		});
	}

	ngOnInit() {
		this.route.queryParams.pipe(takeUntil(this.destroy$$)).subscribe((params) => {
			if (!params['d']) {
				this.updateQuery('m', this.selectedDate$$.value, true);
			} else {
				const dateSplit = params['d'].split('-');
				if (dateSplit.length === 3) {
					const date = new Date(dateSplit[0], dateSplit[1] - 1, dateSplit[2]);
					this.selectedDate$$.next(date);
					this.newDate$$.next({ date, isWeekChange: false });
				} else {
					this.updateQuery('m', this.selectedDate$$.value, true);
				}
			}
			setTimeout(() => {
				if (!params['v']) {
					this.calendarViewFormControl.setValue('month', { onlySelf: true, emitEvent: false });
				} else {
					this.calendarViewFormControl.setValue(this.paramsToCalendarView[params['v']], { onlySelf: true, emitEvent: false });
				}
			}, 0);
		});

		this.calendarViewFormControl.valueChanges.pipe(filter(Boolean), skip(1), takeUntil(this.destroy$$)).subscribe({
			next: (value) => {
				this.updateQuery(this.calendarViewToParam[value]);
			},
		});

		combineLatest([this.route.params, this.route.queryParams])
			.pipe(
				filter(([params, queryParams]) => !!params[ABSENCE_TYPE] && !!queryParams['v'] && !!queryParams['d']),
				distinctUntilChanged(this.distinctUntilChanged),
				map(this.getFromAndToDate),
				switchMap(([absenceType, { fromDate, toDate }]) => {
					return this.absenceApiSvc.absencesForCalendar$(absenceType, fromDate, toDate);
				}),
			)
			.subscribe({
				next: (data) => {
					console.log({ data });
				},
			});
	}

	public override ngOnDestroy(): void {
		super.ngOnDestroy();
	}

	private distinctUntilChanged([preParams, preQueryParam], [currParams, currQueryParam]): boolean {
		if (preParams[ABSENCE_TYPE] !== currParams[ABSENCE_TYPE]) return false;

		if (preQueryParam['v'] !== currQueryParam['v']) return false;

		const [currYear, currMonth, currDay] = currQueryParam['d'].split('-');

		const [preYear, preMonth, preDay] = preQueryParam['d'].split('-');

		const currDate = new Date(currYear, currMonth - 1, currDay, 0, 0, 0, 0);

		const preDate = new Date(preYear, preMonth - 1, preDay, 0, 0, 0, 0);

		switch (true) {
			case currQueryParam['v'] === 'm':
				if (currMonth !== preMonth || currYear !== preYear) {
					return false;
				}
				return true;
			case currQueryParam['v'] === 'w':
				if (currMonth !== preMonth || currYear !== preYear) {
					return false;
				}
				const firstDayOfPreWeek = new Date().setDate(preDate.getDate() - (preDate.getDay() ? preDate.getDay() : 7));

				const firstDayOfCurrWeek = new Date().setDate(currDate.getDate() - (currDate.getDay() ? currDate.getDay() : 7));

				if (firstDayOfPreWeek !== firstDayOfCurrWeek) {
					return false;
				}
				return true;
			default:
				return false;
		}
	}

	private getFromAndToDate([params, queryParam]) {
		const [year, month, day] = queryParam['d'].split('-');

		const currDate = new Date(+year, +month - 1, +day, 0, 0, 0, 0);

		let fromDate: string;

		let toDate: string;
		switch (true) {
			case queryParam['v'] === 'm':
				fromDate = DateTimeUtils.DateDistributedToString(new Date(+year, +month - 1, 1), '-');

				toDate = DateTimeUtils.DateDistributedToString(new Date(+year, +month, 0), '-');

				return [params[ABSENCE_TYPE], { fromDate, toDate }];
			case queryParam['v'] === 'w':
				currDate.setDate(currDate.getDate() - (currDate.getDay() ? currDate.getDay() - 1 : 6));

				fromDate = DateTimeUtils.DateDistributedToString(currDate, '-');

				currDate.setDate(currDate.getDate() + 6);

				toDate = DateTimeUtils.DateDistributedToString(currDate, '-');

				return [params[ABSENCE_TYPE], { fromDate, toDate }];
			default:
				return [params[ABSENCE_TYPE], { fromDate: queryParam['d'], toDate: queryParam['d'] }];
		}
	}

	public setForm(event: FormControl<Date>) {
		this.dataControl = event;
		this.dataControl.setValue(this.selectedDate$$.value, { onlySelf: true, emitEvent: false });
		this.dataControl.valueChanges.pipe(takeUntil(this.destroy$$), distinctUntilChanged()).subscribe({
			next: (value) => {
				this.updateQuery('', value);
			},
		});
	}

	private updateQuery(queryStr?: string, date?: Date, replaceUrl: boolean = false) {
		this.router.navigate([], {
			queryParams: {
				...(queryStr ? { v: queryStr } : {}),
				...(date ? { d: this.datePipe.transform(date, 'yyyy-MM-dd') } : {}),
			},
			queryParamsHandling: 'merge',
			replaceUrl,
		});
	}

	public updateToToday() {
		this.updateQuery('', new Date());
	}

	public changeToDayView(date: Date) {
		this.calendarViewFormControl.setValue('day');
		this.updateQuery('d', date);
	}

	public updateDate(newDate: Date) {
		this.updateQuery('', newDate);
	}

	public changeDate(offset: number) {
		switch (this.calendarViewFormControl.value) {
			case 'day':
				this.changeDate$$.next(offset);
				break;
			case 'week':
				this.changeWeek$$.next(offset);
				break;
			case 'month':
				this.changeMonth$$.next(offset);
				break;
			default:
		}
	}
}
















