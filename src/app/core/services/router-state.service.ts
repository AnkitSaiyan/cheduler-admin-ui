import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Params, Router } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable } from 'rxjs';
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

      let state: ActivatedRouteSnapshot = snapshot.root;

      // Getting params
      let params = {};
      while (state.firstChild) {
        params = { ...params, ...state.params };
        state = state.firstChild;
      }
      params = { ...params, ...state.params };

      const url = snapshot.url.split('?')[0];
      const { queryParams } = snapshot.root;
      const { data } = state.data;

      const routerState: RouterState = { params, queryParams, url, data };

      this.routerState$$.next(routerState);
    });
  }

  public get routerState$() {
    return this.routerState$$.asObservable().pipe(filter((params) => !!params));
  }

  public listenForParamChange$(paramName: string): Observable<string> {
    return this.routerState$$.pipe(
      map((state) => state.params[paramName]),
      distinctUntilChanged(),
    );
  }

  public listenForQueryParamsChanges$(): Observable<Params> {
    return this.routerState$$.pipe(
      map((state) => state.queryParams),
      distinctUntilChanged(),
    );
  }
}
