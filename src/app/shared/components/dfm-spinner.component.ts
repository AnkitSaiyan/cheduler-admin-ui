import { Component } from '@angular/core';

@Component({
  selector: 'dfm-spinner',
  template: ` <div #spinner class="dfm-spinner"></div> `,
  styles: [
    `
      .dfm-spinner::before {
        position: absolute;
        content: '';
        height: 24px;
        width: 24px;
        border-radius: 50%;
        border: 2px solid lightgray;
        border-bottom-color: var(--dfm-primary);
        animation: 1s linear infinite spin;
        background: transparent;
      }

      @keyframes spin {
        0% {
          transform: rotateZ(0deg);
        }
        100% {
          transform: rotateZ(360deg);
        }
      }
    `,
  ],
})
export class DfmSpinnerComponent {}
