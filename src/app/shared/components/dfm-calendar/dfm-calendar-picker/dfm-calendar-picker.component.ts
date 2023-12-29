import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
	selector: 'dfm-calendar-picker',
	templateUrl: './dfm-calendar-picker.component.html',
})
export class DfmCalendarPickerComponent implements OnInit {
	public dateControl: FormControl = new FormControl();

	@Input() selectedDate!: Date | null;

	@Output() formControl: EventEmitter<FormControl<Date>> = new EventEmitter<FormControl<Date>>();

	ngOnInit(): void {
		this.formControl.emit(this.dateControl);
		// this.shareDataSvc.getLanguage$().subscribe((lang) =>this._adapter.setLocale(lang))
	}
}
