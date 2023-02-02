import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';

@Component({
  selector: 'dfm-calendar-day-view',
  templateUrl: './dfm-calendar-day-view.component.html',
  styleUrls: ['./dfm-calendar-day-view.component.scss'],
})
export class DfmCalendarDayViewComponent implements OnInit, OnChanges {
  public selectedDate!: Date;

  public selectedDateOnly!: number;

  public todayDate = new Date();

  @Input()
  public changeDate$$ = new BehaviorSubject<number>(0);

  @Input()
  public newDate$$ = new BehaviorSubject<Date | null>(null);

  @Output()
  public selectedDateEvent = new EventEmitter<Date>();

  constructor() {}

  public ngOnChanges() {
    if (!this.selectedDate) {
      this.updateDate(new Date());
    }
  }

  public ngOnInit(): void {
    this.changeDate$$
      .asObservable()
      .pipe(filter((offset) => !!offset))
      .subscribe((offset) => {
        this.changeDate(offset);
      });

    this.newDate$$
      .asObservable()
      .pipe()
      .subscribe((date) => {
        if (date) {
          this.updateDate(date);
        }
      });
  }

  private changeDate(offset: number) {
    if (this.selectedDate) {
      const date = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + offset));
      this.updateDate(date);
      this.emitDate();
    }
  }

  private updateDate(date: Date) {
    this.selectedDate = date;
    this.selectedDateOnly = date.getDate();
  }

  private emitDate(): void {
    this.selectedDateEvent.emit(this.selectedDate);
  }
}
