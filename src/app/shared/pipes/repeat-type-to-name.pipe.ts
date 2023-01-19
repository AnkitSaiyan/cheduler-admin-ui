import { Pipe, PipeTransform } from '@angular/core';
import { RepeatType } from '../models/absence.model';

@Pipe({
  name: 'repeatTypeToName',
})
export class RepeatTypeToNamePipe implements PipeTransform {
  private repeatTypeName = {
    daily: 'Days',
    weekly: 'Weeks',
    monthly: 'Months',
  };

  public transform(repeatType: RepeatType | undefined | null): string {
    switch (repeatType) {
      case RepeatType.Daily:
      case RepeatType.Weekly:
      case RepeatType.Monthly:
        return this.repeatTypeName[repeatType];
      default:
        return '';
    }
  }
}
