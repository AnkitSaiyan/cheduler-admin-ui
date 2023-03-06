import { Pipe, PipeTransform } from '@angular/core';
import { NameValue } from '../components/search-modal.component';

@Pipe({
  name: 'nameValuePair',
})
export class NameValuePairPipe implements PipeTransform {
  public transform(arr: any[], nameKey?: string, valueKey?: string, descriptionKey?: string): NameValue[] {
    if (!arr || !arr?.length) {
      return [];
    }

    return arr.map((val) => ({
      name: nameKey ? /*(valueKey ? `${val[valueKey]} ` : '') + */val[nameKey]?.toString() : val?.toString(),
      value: valueKey ? val[valueKey]?.toString() : val?.toString(),
      ...(descriptionKey ? { description: val[descriptionKey] } : {}),
    }));
  }
}
