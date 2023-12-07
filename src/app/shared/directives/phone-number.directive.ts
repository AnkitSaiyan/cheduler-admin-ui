import { Directive, HostListener, Input } from '@angular/core';
import { InputComponent } from 'diflexmo-angular-design';

@Directive({
	selector: '[dfmPhoneNumber]',
})
export class PhoneNumberDirective {
	@HostListener('input', ['$event'])
	private onChange(e: InputEvent) {
		e.preventDefault();
		e.stopImmediatePropagation();
		e.stopPropagation();
		this.handleChange();
	}

	@Input()
	public dfmPhoneNumber!: InputComponent;

	private numberOnly: RegExp = /^[\d\s,]*$/;

	private handleChange() {
		const inputText = this.dfmPhoneNumber.value?.toString();

		if (inputText?.length === 1 && inputText === '+') {
			return;
		}

		if (inputText && !inputText.match(this.numberOnly)) {
			this.dfmPhoneNumber.value = inputText.slice(0, -1);
		}
	}
}
