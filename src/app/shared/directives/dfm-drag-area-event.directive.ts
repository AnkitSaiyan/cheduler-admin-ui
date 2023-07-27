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
	onDragOver(event: DragEvent) {
		event.preventDefault();
    if(!this.draggableSvc.dragStartElement)return
		this.draggableSvc.createDragShadow(event, this.elementRef);
	}

	@HostListener('dragleave', ['$event'])
	onDragLeave(event: DragEvent | any) {
    if(!this.draggableSvc.dragStartElement)return
		this.draggableSvc.removeDragShadow(this.elementRef);
		event.stopPropagation();
	}

	@HostListener('drop', ['$event'])
	onDragDrop(event: DragEvent | any) {
    if (!this.draggableSvc.dragStartElement) return;
		this.draggableSvc.dragEndElementRef = this.elementRef;
		this.draggableSvc.removeDragShadow(this.elementRef);
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


