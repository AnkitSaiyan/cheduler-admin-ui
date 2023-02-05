import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { Appointment } from '../../../../shared/models/appointment.model';

@Component({
  selector: 'dfm-appointment-calendar',
  templateUrl: './appointment-calendar.component.html',
  styleUrls: ['./appointment-calendar.component.scss'],
})
export class AppointmentCalendarComponent implements OnInit {
  public calendarViewFormControl = new FormControl();

  public selectedDate: Date = new Date();

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

  public changeWeek$$ = new BehaviorSubject<number>(0);

  public changeMonth$$ = new BehaviorSubject<number>(0);

  public newDate$$ = new BehaviorSubject<Date | null>(null);

  @Input()
  public headerList!: NameValue[];

  @Input()
  public appointmentsGroupedByDate!: { [key: string]: Appointment[] };

  @Input()
  public appointmentsGroupedByDateAndTIme!: { [key: string]: { group: number; data: any }[] };

  constructor() {}

  public ngOnInit(): void {
    this.calendarViewFormControl.setValue('week');

    console.log(this.appointmentsGroupedByDateAndTIme);

    this.calendarViewFormControl.valueChanges.pipe().subscribe((value) => {
      this.newDate$$.next(this.selectedDate);
    });
  }

  public updateDate(newDate: Date) {
    this.selectedDate = new Date(newDate);
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

  public changeToDayView(date: number) {
    this.calendarViewFormControl.setValue('day');
    const newDate = new Date(this.selectedDate.setDate(date));
    this.newDate$$.next(newDate);
    this.selectedDate = new Date(newDate);
  }

  public updateToToday() {
    if (this.selectedDate?.toDateString() !== new Date().toDateString()) {
      this.newDate$$.next(new Date());
    }
  }
}
