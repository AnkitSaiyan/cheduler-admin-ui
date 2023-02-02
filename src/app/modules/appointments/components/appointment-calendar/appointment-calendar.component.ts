import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { NameValue } from '../../../../shared/components/search-modal.component';

@Component({
  selector: 'dfm-appointment-calendar',
  templateUrl: './appointment-calendar.component.html',
  styleUrls: ['./appointment-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentCalendarComponent implements OnInit {
  public calendarViewFormControl = new FormControl();

  public selectedDate!: Date;

  public calendarViewType: NameValue[] = [
    {
      name: 'Day',
      value: 'day',
    },
    {
      name: 'Week',
      value: 'week',
    },
    {
      name: 'Month',
      value: 'month',
    },
  ];

  public changeDate$$ = new BehaviorSubject<number>(0);

  constructor(private cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.calendarViewFormControl.setValue('month');

    this.calendarViewFormControl.valueChanges.pipe().subscribe((value) => {});
  }

  public updateDate(newDate: Date) {
    this.selectedDate = new Date(newDate);
    this.cdr.detectChanges();
  }

  public changeDate(offset: number) {
    this.changeDate$$.next(offset);
  }
}
