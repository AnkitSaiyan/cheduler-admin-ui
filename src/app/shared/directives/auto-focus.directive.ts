import { AfterViewChecked, AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'autofocus',
})
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class AutoFocus implements AfterViewInit , AfterViewChecked {
  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.elementRef.nativeElement.focus();
    }, 1000);
    this.elementRef.nativeElement.focus();
  }

  // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
  ngAfterViewChecked() {
    this.elementRef.nativeElement.focus();
  }
}
