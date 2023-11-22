import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
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
		this.handleChange(e);
	}

	@Input()
	public dfmNumberInput!: InputComponent;

	private numberOnly: RegExp = /^\d+$/;

	constructor(private elementRef: ElementRef, private r: Renderer2) {}

	private handleChange(e: InputEvent) {
		const inputText = this.dfmNumberInput.value?.toString();

		if (inputText && !inputText.match(this.numberOnly)) {
			this.dfmNumberInput.value = +inputText.slice(0, -1);
		}
	}
}
