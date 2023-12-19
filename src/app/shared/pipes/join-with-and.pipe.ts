import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'joinWithAnd',
})
export class JoinWithAndPipe implements PipeTransform {
	public transform(value: any[] | undefined, key?: string, key2?: string): string {
		if (!Array.isArray(value)) {
			return '';
		}

		if (!value?.length) {
			return '';
		}

		if (key2) {
			return this.joinWithAnd2(value, key ?? '', key2 ?? '');
		} else {
			return this.joinWithAnd(value, key ?? '');
		}
	}

	private joinWithAnd(arr: any[], key: string) {
		let firsts;
		let last;
		
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
		return `${firsts.join(', ')} & ${last}`;
	}

	private joinWithAnd2(key, key2, arr) {
		let firsts;
		let last;

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

		return `${firsts.join(', ')} & ${last}`;
	}
}
