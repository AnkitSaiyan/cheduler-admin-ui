import { Pipe, PipeTransform } from '@angular/core';
import { Weekday } from '../models/calendar.model';

@Pipe({
  name: 'weekdayToName',
})
export class WeekdayToNamePipe implements PipeTransform {
  private weekdays = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
  };

  public transform(weekday: Weekday | any[], short = false): any {
    if (typeof weekday === 'number') {
      switch (weekday) {
        case Weekday.MON:
        case Weekday.TUE:
        case Weekday.WED:
        case Weekday.THU:
        case Weekday.FRI:
        case Weekday.SAT:
        case Weekday.SUN:
          return (short ? this.weekdays[weekday].slice(0, 3) : this.weekdays[weekday]) as string;
        default:
          return '';
      }
    } else if (Array.isArray(weekday)) {
      return weekday.map((d: number) => (short ? this.weekdays[d].slice(0, 3) : this.weekdays[d])) as String[];
    }
    return '';
  }
}
