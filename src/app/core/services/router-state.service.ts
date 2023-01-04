import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, filter, map } from 'rxjs';
import { RouterState } from '../../shared/models/router-state.model';

@Injectable({
  providedIn: 'root',
})
export class RouterStateService {
  private routerState$$ = new BehaviorSubject<RouterState>({} as RouterState);

  constructor(private router: Router) {
    this.createRouterState();
  }

  private createRouterState() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const { snapshot } = this.router.routerState;
      const { queryParams } = snapshot.root;
      const url = snapshot.url.split('?')[0];
    });
  }

  public listenForParamChange$(paramName: string) {
    return this.routerState$$.pipe(
      map((state) => state.params[paramName]),
      distinctUntilChanged(),
    );
  }
}
