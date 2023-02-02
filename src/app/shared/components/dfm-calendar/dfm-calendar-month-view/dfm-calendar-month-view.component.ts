import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getDaysOfMonth, getWeekdayWiseDays, Weekday } from '../../../models/calendar.model';

@Component({
  selector: 'dfm-calendar-month-view',
  templateUrl: './dfm-calendar-month-view.component.html',
  styleUrls: ['./dfm-calendar-month-view.component.scss'],
})
export class DfmCalendarMonthViewComponent implements OnInit {
  public weekDayEnum = Weekday;

  public selectedDate = new Date();

  public nowDate = new Date();

  public daysInMonthMatrix: number[][] = [];

  @Input()
  public changeDate$$ = new BehaviorSubject<number>(0);

  @Output()
  public selectedDateEvent = new EventEmitter<Date>();

  constructor() {}

  public ngOnInit(): void {
    this.emitDate();

    this.changeDate$$
      .asObservable()
      .pipe()
      .subscribe((offset) => {
        this.changeMonth(offset);
      });
  }

  public changeMonth(offset: number) {
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();

    // checking if prev or next month has today's date
    if (getDaysOfMonth(year, month + offset) < this.selectedDate.getDate()) {
      this.selectedDate.setDate(1);
    }

    this.selectedDate.setMonth(this.selectedDate.getMonth() + offset);

    // if selected month is today's month then selected today's date by default
    if (this.selectedDate.getMonth() === new Date().getMonth()) {
      this.selectedDate.setDate(new Date().getDate());
    }

    this.updateCalendarDays();
    this.emitDate();
  }

  private updateCalendarDays() {
    this.daysInMonthMatrix = getWeekdayWiseDays(this.selectedDate);
  }

  private emitDate() {
    this.selectedDateEvent.emit(this.selectedDate);
  }
}
