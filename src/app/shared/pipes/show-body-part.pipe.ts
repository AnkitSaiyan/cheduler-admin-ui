import { TitleCasePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'bodyPartDetail',
})
export class ShowBodyPartPipe implements PipeTransform {
	transform(value: any): any {
		return value.map(({ bodypartName }) => bodypartName).join(', ');
	}
}

