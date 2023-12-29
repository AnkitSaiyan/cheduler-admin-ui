import { Directive, HostListener, Input } from '@angular/core';
import { InputComponent } from 'diflexmo-angular-design';

@Directive({
	selector: '[dfmEmailInput]',
})
export class EmailInputDirective {
	@HostListener('input', ['$event'])
	private onChange(e: InputEvent) {
		e.preventDefault();
		e.stopImmediatePropagation();
		e.stopPropagation();
		this.handleChange();
	}

	@Input()
	public dfmEmailInput!: InputComponent;

	private emailOnly: RegExp = /(.+)@(.+){2,}\.(.+){2,}/;

	private handleChange() {
		const inputText = this.dfmEmailInput.value as string;

		if (inputText && !this.emailOnly.exec(inputText)) {
			this.dfmEmailInput.value = inputText.slice(0, -1);
		}
	}
}
