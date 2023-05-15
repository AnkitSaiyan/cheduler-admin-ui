import { Pipe, PipeTransform } from '@angular/core';
import { NextSlotOpenPercentageData } from '../models/priority-slots.model';

@Pipe({
	name: 'showSlotPercentage',
})
export class ShowSlotPercentagePipe implements PipeTransform {
	private slotPriorityKey = {
		High: 'highPriorityPercentage',
		Medium: 'mediumPriorityPercentage',
		Low: 'lowPriorityPercentage',
	};
	transform(currentPrioritySlot: any, slotPercentage: NextSlotOpenPercentageData, prioritySlots: any[]): boolean {
		if (prioritySlots.length === 1) return true;
		if (currentPrioritySlot.priority === 'High') return true;

		switch (true) {
			case currentPrioritySlot.priority === 'Medium': {
				const highPrioritySlot = prioritySlots.find((value) => value.priority === 'High');
				if (highPrioritySlot?.nxtSlotOpenPct && highPrioritySlot.nxtSlotOpenPct <= slotPercentage.highPriorityPercentage) {
					return true;
				}
				break;
			}
			case currentPrioritySlot.priority === 'Low': {
				if (
					prioritySlots
						.filter((value) => value.priority !== 'Low')
						.every((item) => item.nxtSlotOpenPct <= slotPercentage[this.slotPriorityKey[item.priority]])
				) {
					return true;
				}
				break;
			}
			default:
				break;
		}

		return false;
	}
}

