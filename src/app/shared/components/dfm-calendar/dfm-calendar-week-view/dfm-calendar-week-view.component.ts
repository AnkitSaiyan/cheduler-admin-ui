import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getAllDaysOfWeek } from '../../../models/calendar.model';

@Component({
  selector: 'dfm-calendar-week-view',
  templateUrl: './dfm-calendar-week-view.component.html',
  styleUrls: ['./dfm-calendar-week-view.component.scss'],
})
export class DfmCalendarWeekViewComponent implements OnInit {
  public weekdays = [0, 1, 2, 3, 4, 5, 6];

  public daysOfWeekArr: number[] = [];

  public selectedDate = new Date();

  public todayDate = new Date();

  @Input()
  public changeDate$$ = new BehaviorSubject<number>(0);

  @Output()
  public selectedDateEvent = new EventEmitter<Date>();

  constructor() {}

  public ngOnInit(): void {
    this.changeDate$$
      .asObservable()
      .pipe()
      .subscribe((offset) => {
        this.changeWeek(offset);
      });
  }

  public changeWeek(offset: number) {
    if (offset !== 0) {
      this.selectedDate = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + offset * 7));
    }

    this.updateCalendarDays();
    this.emitDate();

    // const year = this.selectedDate.getFullYear();
    // const month = this.selectedDate.getMonth();
    //
    //
    // // checking if prev or next month has today's date
    // if (getDaysOfMonth(year, month + offset) < this.selectedDate.getDate()) {
    //   this.selectedDate.setDate(1);
    // }
    //
    // this.selectedDate.setMonth(this.selectedDate.getMonth() + offset);
    //
    // // if selected month is today's month then selected today's date by default
    // if (this.selectedDate.getMonth() === new Date().getMonth()) {
    //   this.selectedDate.setDate(new Date().getDate());
    // }
  }

  private updateCalendarDays() {
    this.daysOfWeekArr = getAllDaysOfWeek(this.selectedDate);
  }

  private emitDate() {
    this.selectedDateEvent.emit(this.selectedDate);
  }
}
