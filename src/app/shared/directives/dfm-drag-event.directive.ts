import { Directive, HostListener, Input } from '@angular/core';
import { ShareDataService } from 'src/app/core/services/share-data.service';

@Directive({
	selector: '[dfmDragEvent]',
})
export class DfmDragEventDirective {
	constructor(private shareSvc: ShareDataService) {}
	@Input() appointmentData!: any;

	@HostListener('dragstart', ['$event'])
	onDragStart(event: DragEvent | any) {
		this.shareSvc.dragStartElementRef = { event, data: this.appointmentData };
		event.stopPropagation();
	}
	@HostListener('dragover', ['$event'])
	onDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
	}
	@HostListener('dragenter', ['$event'])
	onDragEnter(event: DragEvent) {
		event.stopPropagation();
	}

	@HostListener('drop', ['$event'])
	onDragDrop(event: DragEvent) {
		event.stopPropagation();
		this.shareSvc.dragStartElementRef = undefined;
	}
}

