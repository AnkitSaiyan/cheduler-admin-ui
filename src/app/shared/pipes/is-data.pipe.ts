import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'isData',
})
export class IsDataPipe implements PipeTransform {
	public transform(value: any[], key: string): boolean {
		if (!value.length) {
			return false;
		}

		return value.some((v) => v[key]?.length);
	}
}
