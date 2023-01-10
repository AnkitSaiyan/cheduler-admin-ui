import { Component } from '@angular/core';

@Component({
  selector: 'dfm-input-dropdown-wrapper',
  template: ` <div class="wrapper"></div> `,
  styles: [
    `
      .wrapper {
        background: white;
        border: 1px solid var(--dfm-input-border);
        border-radius: 8px;
        height: 40px;
      }
    `,
  ],
})
export class InputDropdownWrapperComponent {}
