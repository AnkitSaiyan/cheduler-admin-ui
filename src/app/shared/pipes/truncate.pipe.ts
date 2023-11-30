import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 30, suffix: string = '...'): string {
    if (value?.length > limit) {
      return value.substring(0, limit).trim() + suffix;
    }
    return value;
  }
}