import { Directive, HostListener, Input } from '@angular/core';
import { InputComponent } from 'diflexmo-angular-design';

@Directive({
	selector: '[dfmNumberInput]',
})
export class NumberInputDirective {
	@HostListener('input', ['$event'])
	private onChange(e: InputEvent) {
		e.preventDefault();
		e.stopImmediatePropagation();
		e.stopPropagation();
		this.handleChange();
	}

	@Input()
	public dfmNumberInput!: InputComponent;

	private numberOnly: RegExp = /^\d+$/;

	private handleChange() {
		const inputText = this.dfmNumberInput.value?.toString();

		if (inputText && !inputText.match(this.numberOnly)) {
			this.dfmNumberInput.value = +inputText.slice(0, -1);
		}
	}
}
