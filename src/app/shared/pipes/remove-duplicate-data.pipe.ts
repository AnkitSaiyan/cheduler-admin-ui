import { Pipe, PipeTransform } from '@angular/core';
import { GeneralUtils } from '../utils/general.utils';

@Pipe({
	name: 'removeDuplicateData',
})
export class RemoveDuplicateDataPipe implements PipeTransform {
	transform(value: any[], key?: string[]): Array<any> {
		const arr: any = [];
		if (key?.[1]) {
			value.forEach((data) => {
				if (data?.[key[1]].length) {
					arr.push(...(data?.[key[1]] ?? {}));
				}
			});
		} else {
			arr.push(...value);
		}

		if (arr.length) return GeneralUtils.removeDuplicateData(arr, key?.[0] ?? 'id');
		return [];
	}
}
