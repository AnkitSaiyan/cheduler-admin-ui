import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
import { InputComponent } from 'diflexmo-angular-design-dev';

@Directive({
  selector: '[dfmEmailInput]',
})
export class EmailInputDirective {
  @HostListener('input', ['$event'])
  private onChange(e: InputEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.handleChange(e);
  }

  @Input()
  public dfmEmailInput!: InputComponent;

  private emailOnly: RegExp = /(.+)@(.+){2,}\.(.+){2,}/;

  constructor(private elementRef: ElementRef, private r: Renderer2) {}

  private handleChange(e: InputEvent) {
    const inputText = this.dfmEmailInput.value as string;

    if (inputText && !inputText.match(this.emailOnly)) {
      this.dfmEmailInput.value = inputText.slice(0, -1);
    }
  }
}
