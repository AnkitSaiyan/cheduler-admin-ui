import { Directive, ElementRef, HostListener, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { DraggableService } from 'src/app/core/services/draggable.service';
import { CalendarType } from '../utils/const';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
@Directive({
	selector: '[dfmDragEvent]',
})
export class DfmDragEventDirective implements OnChanges {
	constructor(private draggableSvc: DraggableService, private elementRef: ElementRef) {}

	@Input() draggedElData!: any;
	@Input() calendarType: CalendarType = CalendarType.Week;
	@Input() headerType!: string;
	@Input() ngbPopoverDrag!: NgbPopover;

	ngOnChanges(changes: SimpleChanges): void {
		if (this.elementRef.nativeElement.draggable) {
			this.elementRef.nativeElement.classList.add('dfm-cursor-grabbing');
		}
	}

	@HostListener('dragstart', ['$event'])
	onDragStart(event: DragEvent | any) {
		if (this.ngbPopoverDrag) this.ngbPopoverDrag.close();
		if (event.currentTarget !== event.target) return;
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

