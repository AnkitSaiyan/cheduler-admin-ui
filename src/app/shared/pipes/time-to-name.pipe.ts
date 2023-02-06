import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeToName',
})
export class TimeToNamePipe implements PipeTransform {
  public transform(time: number, type: 'hr' | 'min'): string {
    // switch (type) {
    //   case 'hr':
    //
    //   case 'min':
    //   default:
    //     return `${time}`;
    // }
    return time + type;
  }
}
