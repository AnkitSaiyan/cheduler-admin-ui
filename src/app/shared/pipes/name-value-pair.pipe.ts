import { Pipe, PipeTransform } from '@angular/core';
import { NameValue } from '../components/search-modal.component';

@Pipe({
  name: 'nameValuePair',
})
export class NameValuePairPipe implements PipeTransform {
  public transform(value: any[]): NameValue[] {
    if (!value || !value?.length) {
      return [];
    }

    return value.map((val) => ({ name: val, value: val }));
  }
}
