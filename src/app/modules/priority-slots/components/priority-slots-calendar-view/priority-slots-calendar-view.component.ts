import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';

@Component({
  selector: 'dfm-priority-slots-calendar-view',
  templateUrl: './priority-slots-calendar-view.component.html',
  styleUrls: ['./priority-slots-calendar-view.component.scss'],
})
export class PrioritySlotsCalendarViewComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public selectedDate$$: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());

  public dataControl = new FormControl();

  public changeWeek$$ = new BehaviorSubject<number>(0);

  public newDate$$ = new BehaviorSubject<Date | null>(null);

  constructor(private router: Router, private datePipe: DatePipe) {
    super();
  }

  public appointmentsGroupedByDateAndTIme: { [key: string]: any[][] } = {};

  ngOnInit() {
    this.dataControl.valueChanges.pipe(takeUntil(this.destroy$$)).subscribe((value: any) => {
      const date = new Date(value.year, value.month - 1, value.day);
      this.updateDate(date);
      this.newDate$$.next(date);
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public updateDate(newDate: Date) {
    this.selectedDate$$.next(new Date(newDate));
    this.updateQuery('', newDate);
  }

  public updateToToday() {
    if (this.selectedDate$$.value?.toDateString() !== new Date().toDateString()) {
      this.newDate$$.next(new Date());
    }
  }

  public changeDate(offset: number) {
    this.changeWeek$$.next(offset);
  }

  public changeToDayView(date: number) {
    const newDate = new Date(this.selectedDate$$.value.setDate(date));
    this.newDate$$.next(newDate);
    this.selectedDate$$.next(new Date(newDate));
  }

  private updateQuery(queryStr?: string, date?: Date) {
    this.router.navigate([], {
      queryParams: {
        ...(queryStr ? { v: queryStr } : {}),
        ...(date ? { d: this.datePipe.transform(date, 'yyyy-MM-dd') } : {}),
      },
      queryParamsHandling: 'merge',
    });
  }
}

