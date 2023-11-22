import { Directive, ElementRef, HostListener, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { DraggableService } from 'src/app/core/services/draggable.service';
import { CalendarType } from '../utils/const';

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
		setTimeout(() => {
			this.draggableSvc.isDragStarted = true;
		}, 10);
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
		this.draggableSvc.isDragStarted = false;
		if (!this.draggableSvc.dragStartElement) return;
		event.stopPropagation();
	}
}
