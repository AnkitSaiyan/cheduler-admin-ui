import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { DUTCH_BE } from './const';

export interface DateDisplay {
	year: string;
	month: string;
	day: string;
}

export const CUSTOM_DATE_FORMATS = {
	parse: {
		dateInput: { month: 'short', year: 'numeric', day: 'numeric' },
	},
	display: {
		//dateInput: { month: 'short', year: 'numeric', day: 'numeric'},
		dateInput: 'customInput',
		monthYearLabel: { year: 'numeric', month: 'short' },
		dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
		monthYearA11yLabel: { year: 'numeric', month: 'long' },
	},
};

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

	override getMonthNames(): string[] {
		const language = localStorage.getItem('lang');
		if (language === DUTCH_BE) {
			return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
		}
		return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	}
}

