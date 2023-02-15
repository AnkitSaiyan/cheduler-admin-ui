import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
import { InputComponent } from 'diflexmo-angular-design';

@Directive({
  selector: '[dfmNameInput]',
})
export class NameInputDirective {
  @HostListener('input', ['$event'])
  private onChange(e: InputEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.handleChange(e);
  }

  @Input()
  public dfmNameInput!: InputComponent;

  private alphabetOnly: RegExp = /^[A-Za-z]+$/;

  constructor(private elementRef: ElementRef, private r: Renderer2) {}

  private handleChange(e: InputEvent) {
    const inputText = this.dfmNameInput.value as string;

    if (inputText && !inputText.match(this.alphabetOnly)) {
      this.dfmNameInput.value = inputText.slice(0, -1);
    }
  }
}
