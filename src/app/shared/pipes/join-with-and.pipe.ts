import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'joinWithAnd',
})
export class JoinWithAndPipe implements PipeTransform {
  public transform(value: any[], key?: string): string {
    if (!Array.isArray(value)) {
      return value;
    }

    if (!value || !value.length) {
      return '';
    }

    return this.joinWithAnd(value, key ?? '');
  }

  private joinWithAnd(arr: any[], key: string) {
    if (arr.length === 1) {
      return key ? arr[0][key] : arr[0];
    }
    let firsts;
    let last;
    if (key) {
      firsts = arr.map((value) => value[key]).slice(0, arr.length - 1);
      last = arr[arr.length - 1][key];
    } else {
      firsts = arr.slice(0, arr.length - 1);
      last = arr[arr.length - 1];
    }

    return `${firsts.join(', ')} and ${last}`;
  }
}
