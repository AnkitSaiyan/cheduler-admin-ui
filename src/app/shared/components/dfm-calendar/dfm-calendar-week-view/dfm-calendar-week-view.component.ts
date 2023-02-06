import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, filter, takeUntil } from 'rxjs';
import { getAllDaysOfWeek } from '../../../models/calendar.model';
import { DestroyableComponent } from '../../destroyable.component';

@Component({
  selector: 'dfm-calendar-week-view',
  templateUrl: './dfm-calendar-week-view.component.html',
  styleUrls: ['./dfm-calendar-week-view.component.scss'],
})
export class DfmCalendarWeekViewComponent extends DestroyableComponent implements OnInit, OnChanges, OnDestroy {
  public daysOfWeekArr: number[] = [];

  public todayDate = new Date();

  @Input()
  public selectedDate!: Date;

  @Input()
  public changeWeek$$ = new BehaviorSubject<number>(0);

  @Input()
  public newDate$$ = new BehaviorSubject<Date | null>(null);

  @Output()
  public selectedDateEvent = new EventEmitter<Date>();

  @Output()
  public dayViewEvent = new EventEmitter<number>();

  constructor() {
    super();
  }

  public ngOnChanges() {
    if (!this.selectedDate) {
      this.selectedDate = new Date();
    }
  }

  public ngOnInit(): void {
    this.updateCalendarDays();

    this.changeWeek$$
      .pipe(
        filter((offset) => !!offset),
        takeUntil(this.destroy$$),
      )
      .subscribe((offset) => {
        this.changeWeek(offset);
      });

    this.newDate$$
      .asObservable()
      .pipe()
      .subscribe((date) => {
        if (date) {
          this.updateDate(date);
          this.updateCalendarDays();
        }
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public changeWeek(offset: number) {
    console.log(offset);
    if (offset !== 0) {
      const date = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + offset * 7));
      this.updateDate(date);
      this.changeWeek$$.next(0);
    }

    this.updateCalendarDays();
    // this.emitDate();
  }

  private updateCalendarDays() {
    this.daysOfWeekArr = getAllDaysOfWeek(this.selectedDate);
  }

  private updateDate(date: Date) {
    this.selectedDate = date;
    this.emitDate();
  }

  private emitDate() {
    this.selectedDateEvent.emit(this.selectedDate);
  }

  public changeToDayView(day: number, weekday: number) {
    // updating month if selected date is of another month's
    if (day < this.selectedDate.getDate() && weekday > this.selectedDate.getDay()) {
      this.updateDate(new Date(this.selectedDate.setMonth(this.selectedDate.getMonth() + 1)));
    } else if (day > this.selectedDate.getDate() && weekday < this.selectedDate.getDay()) {
      this.updateDate(new Date(this.selectedDate.setMonth(this.selectedDate.getMonth() - 1)));
    }

    this.dayViewEvent.emit(day);
  }
}
