import { Directive, HostListener, Input, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { InputComponent } from 'diflexmo-angular-design';

@Directive({
	selector: '[dfmSsnInput]',
})
export class SsnInputDirective {
	@HostListener('input', ['$event'])
	private onChange(e: InputEvent) {
		e.preventDefault();
		e.stopImmediatePropagation();
		e.stopPropagation();
		this.handleChange();
	}

	@Input()
	public dfmSsnInput!: InputComponent;

	private numberOnly: RegExp = /^[0-9.-]+$/;

	constructor(private control: NgControl) {}

	private handleChange() {
		const inputText = this.dfmSsnInput.value?.toString();

		if (inputText && !inputText.match(this.numberOnly)) {
			this.dfmSsnInput.value = inputText.slice(0, -1); // Remove last characters
			this.control.control?.setValue(this.dfmSsnInput.value); // Update the form control value
		}
	}
}
