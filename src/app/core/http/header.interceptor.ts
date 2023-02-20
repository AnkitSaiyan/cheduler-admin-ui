import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
  constructor() {}

  public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let SubDomain: string;

    console.log(window.location.href.split('/'));

    if (environment.production) {
      SubDomain = 'red-sea-08bb7b903';
    } else {
      SubDomain = 'localhost';
    }

    const newRequest = request.clone({
      setHeaders: {
        SubDomain,
      },
    });

    return next.handle(newRequest);
  }
}
