// Angular
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Sanitize HTML
 * Author: DaiDH
 */
@Pipe({
	name: 'safe',
})
export class SafePipe implements PipeTransform {
	/**
	 * Pipe Constructor
	 *
	 * @param domSanitizer: DomSanitezer
	 */
	// tslint:disable-next-line
	constructor(protected domSanitizer: DomSanitizer) {}

	/**
	 * Transform
	 *
	 * @param value: string
	 * @param type: string
	 */
	transform(value: string, type: string): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
		switch (type) {
			case 'html':
				return this.domSanitizer.bypassSecurityTrustHtml(value);
			case 'style':
				return this.domSanitizer.bypassSecurityTrustStyle(value);
			case 'script':
				return this.domSanitizer.bypassSecurityTrustScript(value);
			case 'url':
				return this.domSanitizer.bypassSecurityTrustUrl(value);
			case 'resourceUrl':
				return this.domSanitizer.bypassSecurityTrustResourceUrl(value);
			default:
				return this.domSanitizer.bypassSecurityTrustHtml(value);
		}
	}
}
