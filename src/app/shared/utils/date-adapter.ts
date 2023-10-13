import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { DUTCH_BE } from './const';




@Injectable({ providedIn: 'root' })
export class CustomDatePickerAdapter extends NativeDateAdapter {
	override getDayOfWeekNames() {
		const language = localStorage.getItem('lang');
		if (language === DUTCH_BE) {
			return ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
		}
		return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
	}

	override getFirstDayOfWeek(): number {
		return 1;
	}
}