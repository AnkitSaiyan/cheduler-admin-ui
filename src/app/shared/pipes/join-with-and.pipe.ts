import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'joinWithAnd',
})
export class JoinWithAndPipe implements PipeTransform {
	public transform(value: any[] | undefined, key?: string, key2?: string): string {
		if (!Array.isArray(value)) {
			return '';
		}

		if (!value || !value.length) {
			return '';
		}

		return this.joinWithAnd(value, key ?? '', key2 ?? '');
	}

	private joinWithAnd(arr: any[], key: string, key2?: string) {
		let firsts;
		let last;
		if (key2) {
			if (arr.length === 1) {
				return key ? `${arr[0][key]} ${arr[0][key2]}` : arr[0];
			}
			if (key) {
				firsts = arr.map((value) => `${value[key]} ${value[key2]}`).slice(0, arr.length - 1);
				last = `${arr[arr.length - 1][key]} ${arr[arr.length - 1][key2]}`;
			} else {
				firsts = arr.slice(0, arr.length - 1);
				last = arr[arr.length - 1];
			}
		} else {
			if (arr.length === 1) {
				return key ? arr[0][key] : arr[0];
			}
			if (key) {
				firsts = arr.map((value) => value[key]).slice(0, arr.length - 1);
				last = arr[arr.length - 1][key];
			} else {
				firsts = arr.slice(0, arr.length - 1);
				last = arr[arr.length - 1];
			}
		}
		return `${firsts.join(', ')} & ${last}`;
	}
}
