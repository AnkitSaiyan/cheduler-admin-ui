import { Pipe, PipeTransform } from '@angular/core';
import { Status, StatusName } from '../models/status';

@Pipe({
  name: 'statusName',
})
export class StatusNamePipe implements PipeTransform {
  public transform(statusCode: Status | undefined | null): StatusName | '' {
    console.log(statusCode);
    switch (statusCode) {
      case Status.Active:
        return 'Active';
      case Status.Inactive:
        return 'Inactive';
      default:
        return '';
    }
  }
}
