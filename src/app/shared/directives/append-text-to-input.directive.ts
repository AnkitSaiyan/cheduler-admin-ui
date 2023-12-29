import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
	selector: '[dfmAppendTextToInput]',
})
export class AppendTextToInputDirective {
	@HostListener('input', ['$event'])
	private onChange() {
		this.handleChange();
	}

	@Input()
	public dfmAppendTextToInput: string = '';

	constructor(private elementRef: ElementRef, private r: Renderer2) {}

	private handleChange() {
		// testing
		this.elementRef.nativeElement.type = 'text';
		this.elementRef.nativeElement.value = 'g';

		this.r.setProperty(this.elementRef.nativeElement, 'value', 'sfdfd');
	}
}
