import { Pipe, PipeTransform } from '@angular/core';
import { GeneralUtils } from '../utils/general.utils';

@Pipe({
	name: 'removeDuplicateData',
})
export class RemoveDuplicateDataPipe implements PipeTransform {
	transform(value: any[], key?: string): Array<any> {
		const arr: any = [];
		if (key) {
			value.forEach((data) => {
				if (data?.[key].length) arr.push(...data?.[key]);
			});
		} else {
			arr.push(...value);
		}

		if (arr.length) return GeneralUtils.removeDuplicateData(arr, 'id');
		return [];
	}
}