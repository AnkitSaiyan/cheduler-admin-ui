import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { ShareDataService } from 'src/app/core/services/share-data.service';

@Component({
	selector: 'dfm-calendar-picker',
	templateUrl: './dfm-calendar-picker.component.html',
})
export class DfmCalendarPickerComponent implements OnInit {
	public dateControl: FormControl = new FormControl();

	@Input() selectedDate!: Date | null;

	@Output() formControl: EventEmitter<FormControl<Date>> = new EventEmitter<FormControl<Date>>();

	constructor(
		private _adapter: DateAdapter<any>,
		private shareDataSvc: ShareDataService
	) {}

	ngOnInit(): void {
		this.formControl.emit(this.dateControl);
		this.shareDataSvc.getLanguage$().subscribe((lang) =>this._adapter.setLocale(lang))
	}
}

