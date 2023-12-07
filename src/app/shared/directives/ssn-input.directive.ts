import { Directive, HostListener, Input } from '@angular/core';
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

	private handleChange() {
		const inputText = this.dfmSsnInput.value?.toString();

		if (inputText && !inputText.match(this.numberOnly)) {
			this.dfmSsnInput.value = inputText.slice(0, -1);
		}
	}
}
