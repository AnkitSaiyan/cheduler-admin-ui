import { Pipe, PipeTransform } from '@angular/core';
import { WeekdayModel } from '../models/weekday.model';

@Pipe({
  name: 'weekdayToName',
})
export class WeekDayToNamePipe implements PipeTransform {
  public transform(weekday: WeekdayModel): string {
    switch (weekday) {
      case WeekdayModel.MON:
        return 'Monday';
      case WeekdayModel.TUE:
        return 'Tuesday';
      case WeekdayModel.WED:
        return 'Wednesday';
      case WeekdayModel.THU:
        return 'Thursday';
      case WeekdayModel.FRI:
        return 'Friday';
      case WeekdayModel.SAT:
        return 'Saturday';
      case WeekdayModel.SUN:
        return 'Sunday';
      default:
        return '';
    }
  }
}
