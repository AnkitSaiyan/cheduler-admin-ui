import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
  constructor() {}

  public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const SubDomain: string = window.location.host.split('.')[0];

    const newRequest = request.clone({
      setHeaders: {
        SubDomain,
      },
    });

    return next.handle(newRequest);
  }
}
