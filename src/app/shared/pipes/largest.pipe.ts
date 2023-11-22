import { Pipe, PipeTransform } from '@angular/core';
import { of } from 'rxjs';

@Pipe({
	name: 'largest',
})
export class LargestPipe implements PipeTransform {
	public transform(value: any[], key?: string): any {
		if (!value?.length) {
			return value;
		}

		let largest = key ? value[0][key] : value[0];

		for (let i = 1; i < value.length; i++) {
			if (key) {
				if (value[i][key] > largest) {
					largest = value[i][key];
				}
			} else if (value[i] > largest) {
				largest = value[i];
			}
		}

		return largest;
	}
}
