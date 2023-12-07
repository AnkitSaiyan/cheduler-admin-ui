import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2 } from '@angular/core';
import { DraggableService } from 'src/app/core/services/draggable.service';
import { CalendarType } from '../utils/const';

@Directive({
	selector: '[dfmDragAreaEvent]',
})
export class DfmDragAreaEventDirective {
	constructor(private elementRef: ElementRef, private draggableSvc: DraggableService, private renderer: Renderer2) {}

	@Input() day!: any;

	@Input() calendarType: CalendarType = CalendarType.Week;

	@Input() headerType!: string;

	@Output() private editAppointment = new EventEmitter<any>();

	@HostListener('dragover', ['$event'])
	onDragOver(event: DragEvent | any) {
		event.preventDefault();
		if (this.calendarType === 'day' && this.headerType !== this.draggableSvc.headerType) return;
		if (!this.draggableSvc.dragStartElement) return;
		if (this.calendarType === 'week' || this.calendarType === 'day') this.draggableSvc.createDragShadow(event, this.elementRef);
		event.target.classList.add('drag-area-border');
	}

	@HostListener('dragleave', ['$event'])
	onDragLeave(event: DragEvent | any) {
		if (this.calendarType === 'day' && this.headerType !== this.draggableSvc.headerType) return;
		if (!this.draggableSvc.dragStartElement) return;
		if (this.calendarType === 'week' || this.calendarType === 'day') this.draggableSvc.removeDragShadow(this.elementRef);
		event.target.classList.remove('drag-area-border');
		event.stopPropagation();
	}

	@HostListener('dragend', ['$event'])
	onDragEnd() {
		this.draggableSvc.isDragStarted = false;
	}

	@HostListener('drop', ['$event'])
	onDragDrop(event: DragEvent | any) {
		event.stopPropagation();
		event.preventDefault();
		this.draggableSvc.isDragStarted = false;
		if (this.calendarType === 'day' && this.headerType !== this.draggableSvc.headerType) return;
		if (!this.draggableSvc.dragStartElement) return;
		this.draggableSvc.dragEndElementRef = this.elementRef;
		event.target.classList.remove('drag-area-border');
		if (!this.draggableSvc.dragStartElement) return;
		switch (this.calendarType) {
			case CalendarType.Day:
				this.draggableSvc.removeDragShadow(this.elementRef);
				this.draggableSvc.dayViewDragComplete(event);
				this.editAppointment.emit({
					event: { ...event, offsetY: event.offsetY - this.draggableSvc.dragStartElement.event.offsetY },
					data: { ...this.draggableSvc.dragStartElement.data },
				});
				return;
			case CalendarType.Week:
				this.draggableSvc.removeDragShadow(this.elementRef);
				this.draggableSvc.weekViewDragComplete(event);
				this.editAppointment.emit({
					event: { ...event, offsetY: event.offsetY - this.draggableSvc.dragStartElement.event.offsetY },
					data: { ...this.draggableSvc.dragStartElement.data },
					day: this.day,
				});
				return;
			case CalendarType.Month: {
				const currentDate = new Date(this.day[2], this.day[1], this.day[0]);
				currentDate.setHours(0, 0, 0, 0);
				const appointmentDate = new Date(this.draggableSvc.dragStartElement.data?.startedAt);
				appointmentDate.setHours(0, 0, 0, 0);
				if (currentDate.getTime() !== appointmentDate.getTime()) {
					this.draggableSvc.monthViewDragComplete();
					this.editAppointment.emit({
						day: this.day,
						data: { ...this.draggableSvc.dragStartElement.data },
					});
				}
				break;
			}

			default:
		}
	}
}
