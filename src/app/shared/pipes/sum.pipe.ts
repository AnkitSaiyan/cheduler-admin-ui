import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sum',
})
export class SumPipe implements PipeTransform {
  public transform(value: any[] | undefined, key?): number {
    let sum = 0;

    if (!value?.length) {
      return sum;
    }

    value.forEach((val) => {
      if (key && typeof val === 'object') {
        sum += +val[key];
      } else {
        sum += +val;
      }
    });

    return sum;
  }
}
