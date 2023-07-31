import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { DraggableService } from 'src/app/core/services/draggable.service';
import { CalendarType } from '../utils/const';
@Directive({
	selector: '[dfmDragEvent]',
})
export class DfmDragEventDirective {
	constructor(private draggableSvc: DraggableService, private elementRef: ElementRef) {}

	@Input() draggedElData!: any;
	@Input() calendarType: CalendarType = CalendarType.Week;
	@Input() headerType!: string;

	@HostListener('dragstart', ['$event'])
	onDragStart(event: DragEvent | any) {
		if (this.calendarType === 'day') this.draggableSvc.headerType = this.headerType;
		this.draggableSvc.dragStartElement = { event, data: this.draggedElData };
		this.draggableSvc.dragStartElementParentRef = this.elementRef;
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
		if (!this.draggableSvc.dragStartElement) return;
		event.stopPropagation();
	}
}












