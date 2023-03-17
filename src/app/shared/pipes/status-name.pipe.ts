import { Pipe, PipeTransform } from '@angular/core';
import { Status, StatusName } from '../models/status.model';

@Pipe({
  name: 'statusName',
})
export class StatusNamePipe implements PipeTransform {
  public transform(statusCode: Status | undefined | null): StatusName | '' {
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
