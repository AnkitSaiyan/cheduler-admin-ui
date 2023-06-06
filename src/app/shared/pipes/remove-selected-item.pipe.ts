import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'sortOrderValidation',
})
export class SortOrderValidation implements PipeTransform {
	public transform(value: any, formValue: any, index: any): boolean {
		return formValue?.roomsForExam?.filter((_, i) => i !== index).some((val: any) => val?.sortOrder && val?.sortOrder === value);
	}
}

