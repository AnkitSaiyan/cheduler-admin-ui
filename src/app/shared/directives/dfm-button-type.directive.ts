import { Directive, ElementRef, Renderer2, Input, OnInit } from '@angular/core';

@Directive({
	selector: '[dfmButtonType],dfm-button-icon',
})
export class DfmButtonTypeDirective implements OnInit {
	@Input('dfmButtonType') buttonType: string = 'button';

	constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

	ngOnInit() {
		if (this.buttonType) {
			this.renderer.setAttribute(this.elementRef.nativeElement.firstChild, 'type', this.buttonType);
		}
	}
}
