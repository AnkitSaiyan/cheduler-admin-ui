import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  template: '',
})
export class DestroyableComponent implements OnDestroy {
  protected destroy$$ = new Subject();

  private destroy() {
    this.destroy$$.next('');
    this.destroy$$.unsubscribe();
  }

  public ngOnDestroy() {
    this.destroy();
  }
}
