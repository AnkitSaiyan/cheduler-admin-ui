import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';

@Component({
	selector: 'dfm-calendar-picker',
	templateUrl: './dfm-calendar-picker.component.html',
})
export class DfmCalendarPickerComponent implements OnInit {
	public dateControl: FormControl = new FormControl();

	@Input() selectedDate!: Date | null;

	@Output() formControl: EventEmitter<FormControl<Date>> = new EventEmitter<FormControl<Date>>();

	constructor() {}

	ngOnInit(): void {
		this.formControl.emit(this.dateControl);
	}
}

