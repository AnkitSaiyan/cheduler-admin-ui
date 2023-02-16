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

  private alphabetOnly: RegExp = /^[A-Za-z\s]+$/;

  constructor(private elementRef: ElementRef, private r: Renderer2) {}

  private handleChange(e: InputEvent) {
    let inputText = this.dfmNameInput.value as string;

    console.log(inputText);

    if ((inputText && !inputText.match(this.alphabetOnly)) || (inputText[inputText.length - 2] === ' ' && inputText[inputText.length - 1] === ' ')) {
      inputText = inputText.slice(0, -1);
      this.dfmNameInput.value = inputText;
      (e.target as HTMLInputElement).value = inputText;
    }

    if (this.dfmNameInput.value.length === 1) {
      this.dfmNameInput.value = this.dfmNameInput.value.trim();
    }
  }
}
