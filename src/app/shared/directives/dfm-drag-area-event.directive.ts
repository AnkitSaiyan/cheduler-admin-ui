import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2 } from '@angular/core';
import { DraggableService } from 'src/app/core/services/draggable.service';
@Directive({
	selector: '[dfmDragAreaEvent]',
})
export class DfmDragAreaEventDirective {
	constructor(private elementRef: ElementRef, private draggableSvc: DraggableService, private renderer: Renderer2) {}

	@Input() day!: any;
	@Input() calendarType: 'day' | 'week' | 'month' = 'week';

	@Output() private editAppointment = new EventEmitter<any>();

	@HostListener('dragover', ['$event'])
	onDragOver(event: DragEvent | any) {
		event.preventDefault();
		if (!this.draggableSvc.dragStartElement) return;
		if (this.calendarType === 'week') this.draggableSvc.createDragShadow(event, this.elementRef);
		event.target.classList.add('drag-area-border');
	}

	@HostListener('dragleave', ['$event'])
	onDragLeave(event: DragEvent | any) {
		if (!this.draggableSvc.dragStartElement) return;
		if (this.calendarType === 'week') this.draggableSvc.removeDragShadow(this.elementRef);
		event.target.classList.remove('drag-area-border');
		event.stopPropagation();
	}

	@HostListener('drop', ['$event'])
	onDragDrop(event: DragEvent | any) {
		event.stopPropagation();
		event.preventDefault();
		if (!this.draggableSvc.dragStartElement) return;
		this.draggableSvc.dragEndElementRef = this.elementRef;
		event.target.classList.remove('drag-area-border');
		if (this.draggableSvc.dragStartElement) {
			if (this.calendarType === 'week') {
				this.draggableSvc.removeDragShadow(this.elementRef);
				this.draggableSvc.weekViewDragComplete(event);
				this.editAppointment.emit({
					event: { ...event, offsetY: event.offsetY - this.draggableSvc.dragStartElement.event.offsetY },
					data: { ...this.draggableSvc.dragStartElement.data },
					day: this.day,
				});
			}
			if (this.calendarType === 'month') {
				this.draggableSvc.monthViewDragComplete(event);
				this.editAppointment.emit({
					day: this.day,
					data: { ...this.draggableSvc.dragStartElement.data },
				});
			}

			console.log(this.day);
		}
	}
}























