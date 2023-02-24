import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberArray',
})
export class NumberArrayPipe implements PipeTransform {
  public transform(end: number, start = 1, step = 1): number[] {
    if (start > end) {
      return [];
    }

    if (step < 1) {
      // eslint-disable-next-line no-param-reassign
      step = 1;
    }

    const numbers: number[] = [];

    for (let i = start; i <= end; i += step) {
      numbers.push(i);
    }

    return numbers;
  }
}
