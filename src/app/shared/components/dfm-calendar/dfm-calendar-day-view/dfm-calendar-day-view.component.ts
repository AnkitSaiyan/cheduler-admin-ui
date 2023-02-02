import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'dfm-calendar-day-view',
  templateUrl: './dfm-calendar-day-view.component.html',
  styleUrls: ['./dfm-calendar-day-view.component.scss'],
})
export class DfmCalendarDayViewComponent implements OnInit {
  public selectedDate = new Date();

  public selectedDateOnly = new Date().getDate();

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
        this.changeDate(offset);
      });
  }

  public changeDate(offset: number) {
    this.selectedDate = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + offset));
    this.selectedDateOnly = this.selectedDate.getDate();
    this.emitDate();
  }

  private emitDate() {
    this.selectedDateEvent.emit(this.selectedDate);
  }
}
