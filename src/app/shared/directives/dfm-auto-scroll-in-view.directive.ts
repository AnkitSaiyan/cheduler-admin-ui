import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
	selector: '[dfmAutoScrollInView]',
})
export class DfmAutoScrollInViewDirective implements AfterViewInit {
	@Input('dfmAutoScrollInView') apply: boolean = true;
	constructor(private elementRef: ElementRef) {}

	ngAfterViewInit() {
		if (this.apply) {
			this.elementRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
		}
	}
}

