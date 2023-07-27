import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2 } from '@angular/core';
import { DraggableService } from 'src/app/core/services/draggable.service';
@Directive({
	selector: '[dfmDragAreaEvent]',
})
export class DfmDragAreaEventDirective {
	constructor(private elementRef: ElementRef, private draggableSvc: DraggableService, private renderer: Renderer2) {}

	@Input() day!: any;

	@Output() private editAppointment = new EventEmitter<any>();

	@HostListener('dragover', ['$event'])
	onDragOver(event: DragEvent | any) {
		event.preventDefault();
		if (!this.draggableSvc.dragStartElement) return;
		this.draggableSvc.createDragShadow(event, this.elementRef);
		event.target.classList.add('drag-area-border');
	}

	@HostListener('dragleave', ['$event'])
	onDragLeave(event: DragEvent | any) {
		if (!this.draggableSvc.dragStartElement) return;
		this.draggableSvc.removeDragShadow(this.elementRef);
		event.target.classList.remove('drag-area-border');
		event.stopPropagation();
	}

	@HostListener('drop', ['$event'])
	onDragDrop(event: DragEvent | any) {
		if (!this.draggableSvc.dragStartElement) return;
		this.draggableSvc.dragEndElementRef = this.elementRef;
		this.draggableSvc.removeDragShadow(this.elementRef);
		event.target.classList.remove('drag-area-border');
		if (this.draggableSvc.dragStartElement) {
			this.draggableSvc.dragComplete(event);
			this.editAppointment.emit({
				event: { ...event, offsetY: event.offsetY - this.draggableSvc.dragStartElement.event.offsetY },
				data: { ...this.draggableSvc.dragStartElement.data },
				day: this.day,
			});
		}
	}
}




