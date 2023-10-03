import { TitleCasePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { ENG_BE } from '../utils/const';

@Pipe({
	name: 'bodyPartDetail',
})
export class ShowBodyPartPipe implements PipeTransform {
	transform(value: any, lang: string): string {
		return value.map(({ bodypartName, bodypartNameNl }) => (lang === ENG_BE ? bodypartName : bodypartNameNl)).join(', ');
	}
}






