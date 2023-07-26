import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2 } from '@angular/core';
import { ShareDataService } from 'src/app/core/services/share-data.service';

@Directive({
	selector: '[dfmDragAreaEvent]',
})
export class DfmDragAreaEventDirective {
	private draggableContainer!: any;
	constructor(private elementRef: ElementRef, private renderer: Renderer2, private shareSvc: ShareDataService) {}
	@Input() day!: any;

	@Output() private editAppointment = new EventEmitter<any>();

	@HostListener('dragover', ['$event'])
	onDragOver(event: DragEvent) {
		event.preventDefault();
	}
	@HostListener('dragenter', ['$event'])
	onDragEnter(event: DragEvent | any) {
		event.preventDefault();
		event.stopPropagation();
		// this.draggableContainer = this.renderer.createElement('div');
		// const calculatedOffsetY: number = event.offsetY - this.shareSvc.dragStartElementRef.offsetY;
		// const top: number = calculatedOffsetY - (calculatedOffsetY % 20);
		// this.draggableContainer.classList.add('drag-area');
		// this.draggableContainer.style.height = `100px`;
		// this.draggableContainer.style.top = `${top}px`;
		// this.renderer.appendChild(this.elementRef.nativeElement, this.draggableContainer);
	}
	@HostListener('dragleave', ['$event'])
	onDragLeave(event: DragEvent | any) {
		// this.elementRef.nativeElement.querySelector('.drag-area').remove();
		event.stopPropagation();
	}
	@HostListener('drop', ['$event'])
	onDragDrop(event: DragEvent | any) {
		this.elementRef.nativeElement.querySelector('.drag-area')?.remove();
		if (this.shareSvc.dragStartElementRef) {
			const calculatedOffsetY: number = event.offsetY - this.shareSvc.dragStartElementRef.event.offsetY;
			const top: number = calculatedOffsetY - (calculatedOffsetY % 20);
			this.shareSvc.dragStartElementRef.event.target.style.top = `${top}px`;
			this.renderer.appendChild(this.elementRef.nativeElement, this.shareSvc.dragStartElementRef.event.target);
			this.editAppointment.emit({
				event: { ...event, offsetY: event.offsetY - this.shareSvc.dragStartElementRef.event.offsetY },
				data: { ...this.shareSvc.dragStartElementRef.data },
				day: this.day,
			});
		}
		this.shareSvc.dragStartElementRef = undefined;
	}
}

