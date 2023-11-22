import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'dashIfNothing',
})
export class DashIfNothingPipe implements PipeTransform {
	public transform(value: any): any {
		if (typeof value !== 'number' && value !== 0 && !value) {
			return '—';
		}
		return value;
	}
}
