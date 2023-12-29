import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'timeToName',
})
export class TimeToNamePipe implements PipeTransform {
	public transform(time: number, type: 'hr' | 'min'): string {
		return time + type;
	}
}
