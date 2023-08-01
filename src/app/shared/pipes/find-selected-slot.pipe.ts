import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'findSelectedSlot',
})
export class FindSelectedSlotPipe implements PipeTransform {
	transform(selectedSlot: any, value: any[]): any {
		return selectedSlot?.[value?.find((item) => selectedSlot[item])];
	}
}

