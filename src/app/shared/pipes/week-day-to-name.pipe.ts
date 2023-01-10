import { Pipe, PipeTransform } from '@angular/core';
import { Weekday } from '../models/weekday';

@Pipe({
  name: 'weekdayToName',
})
export class WeekDayToNamePipe implements PipeTransform {
  public transform(weekday: Weekday): string {
    switch (weekday) {
      case Weekday.MON:
        return 'Monday';
      case Weekday.TUE:
        return 'Tuesday';
      case Weekday.WED:
        return 'Wednesday';
      case Weekday.THU:
        return 'Thursday';
      case Weekday.FRI:
        return 'Friday';
      case Weekday.SAT:
        return 'Saturday';
      case Weekday.SUN:
        return 'Sunday';
      default:
        return '';
    }
  }
}
