import { ElementRef, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Appointment } from 'src/app/shared/models/appointment.model';


@Injectable({
	providedIn: 'root',
})
export class DraggableService {
	private renderer: Renderer2;

	private draggableContainer!: any;

	private dragStarted!: boolean;

	private dragStartElementRefData!: any;

	private dragStartElementDeepCopy!: any;

	private dragStartElementHeight!: number;

	private dragStartElementParentReference!: any;

	private dragEndElementReference!: any;
	private headerTypeValue!: string | undefined;

	constructor(rendererFactory: RendererFactory2) {
		this.renderer = rendererFactory.createRenderer(null, null);
	}

	public set dragStartElement(element: { event: any; data: Appointment }) {
		this.dragStartElementRefData = element;
		this.dragStartElementDeepCopy = element?.event?.target?.cloneNode(true);
		this.dragStartElementHeight = element?.event?.target?.clientHeight;
	}

	public get dragStartElement() {
		return this.dragStartElementRefData;
	}

	public set dragEndElementRef(element: ElementRef) {
		this.dragEndElementReference = element;
	}
	public get isDragStarted() {
		return this.dragStarted;
	}

	public set isDragStarted(value: boolean) {
		this.dragStarted = value;
	}

	public get dragEndElementRef() {
		return this.dragEndElementReference;
	}

	public set dragStartElementParentRef(element: ElementRef) {
		this.dragStartElementParentReference = element.nativeElement.parentElement;
	}

	public get dragStartElementParentRef() {
		return this.dragStartElementParentReference;
	}

	public set headerType(value: string) {
		this.headerTypeValue = value;
	}

	public get headerType() {
		return this.headerTypeValue!;
	}

	public removeRef() {
		this.dragStartElementRefData = undefined;
		this.dragStartElementParentReference = undefined;
		this.dragStartElementDeepCopy = undefined;
		this.dragStartElementHeight = 0;
		this.headerTypeValue = undefined;
	}

	public dayViewDragComplete(event: any) {
		if (!this.dragStartElement || !this.dragEndElementRef) return;
		const cloneElement = this.dragStartElement?.event?.target?.cloneNode(true);
		const calculatedOffsetY: number = event?.offsetY - this.dragStartElement?.event?.offsetY;
		const top: number = calculatedOffsetY - (calculatedOffsetY % 20);
		cloneElement.style.top = `${top}px`;
		this.renderer.appendChild(this.dragEndElementRef?.nativeElement, cloneElement);
		this.renderer?.removeChild(this.dragStartElementParentRef, this.dragStartElement?.event?.target);
	}
	public weekViewDragComplete(event: any) {
		if (!this.dragStartElement || !this.dragEndElementRef) return;
		const cloneElement = this.dragStartElement?.event?.target?.cloneNode(true);
		const cloneParentElement = (this.dragStartElementParentRef as any)?.cloneNode(true);
		while (cloneParentElement.lastElementChild) {
			cloneParentElement.removeChild(cloneParentElement.lastElementChild);
		}
		this.renderer.appendChild(cloneParentElement, cloneElement);
		this.renderer?.removeChild(this.dragStartElementParentRef, this.dragStartElement?.event?.target);
		const calculatedOffsetY: number = event?.offsetY - this.dragStartElement?.event?.offsetY;
		const top: number = calculatedOffsetY - (calculatedOffsetY % 20);
		cloneParentElement.style.top = `${top}px`;
		this.renderer.appendChild(this.dragEndElementRef?.nativeElement, cloneParentElement);
	}

	public monthViewDragComplete(event: any) {
		if (!this.dragStartElement || !this.dragEndElementRef) return;
		const cloneElement = this.dragStartElement?.event?.target?.cloneNode(true);
		this.renderer.appendChild(this.dragEndElementRef?.nativeElement, cloneElement);
		this.renderer?.removeChild(this.dragStartElementParentRef, this.dragStartElement?.event?.target);
	}

	public revertDrag(forceRevert = false) {
		if (forceRevert) {
			this.dragEndElementRef?.nativeElement?.lastChild?.remove();
			this.removeRef();
			return;
		}

		if (!this.dragStartElementParentReference || !this.dragEndElementRef || !this.dragStartElementDeepCopy) {
			return;
		}

		this.renderer?.appendChild(this.dragStartElementParentReference, this.dragStartElement?.event?.target);
		this.dragEndElementRef?.nativeElement?.lastChild?.remove();
		this.removeRef();
	}

	public createDragShadow(event: any, elementRef: ElementRef) {
		this.removeDragShadow(elementRef);
		if (!this.dragStartElementHeight) return;
		this.draggableContainer = this.renderer.createElement('span');
		const dragElement = this.dragStartElementRefData.event;
		const calculatedOffsetY: number = event.offsetY - dragElement.offsetY;
		const top: number = calculatedOffsetY - (calculatedOffsetY % 20);
		this.draggableContainer.classList.add('drag-shadow');
		this.draggableContainer.style.height = `${this.dragStartElementHeight}px`;
		this.draggableContainer.style.top = `${top}px`;
		this.renderer.insertBefore(elementRef.nativeElement, this.draggableContainer, elementRef.nativeElement.firstChild);
	}

	public removeDragShadow(elementRef: ElementRef) {
		elementRef?.nativeElement?.querySelectorAll('.drag-shadow')?.forEach(this.removeEl);
	}

	private removeEl(element: any) {
		element?.remove();
	}
}



























































