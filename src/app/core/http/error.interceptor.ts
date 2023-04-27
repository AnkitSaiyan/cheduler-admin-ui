import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {catchError, Observable, switchMap, throwError} from "rxjs";
import {NotificationDataService} from "../services/notification-data.service";
import { NotificationType } from 'diflexmo-angular-design-dev';
import {LoaderService} from "../services/loader.service";
import {HttpStatusCodes} from "../../shared/models/base-response.model";
import {ShareDataService} from "../services/share-data.service";
import {Translate} from "../../shared/models/translate.model";
import {ENG_BE} from "../../shared/utils/const";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private notificationSvc: NotificationDataService, private loaderSvc: LoaderService, private shareDataSvc: ShareDataService) {
  }
  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
        catchError((err) => {
          console.log(err);

          // lang hardcoded to english for now
          this.generateErrorMessage(err, ENG_BE);
          this.stopLoaders();

          return throwError(err);
        })
    );
    // return this.shareDataSvc.getLanguage$().pipe(
    //     switchMap((lang) => next.handle(req).pipe(
    //         catchError((err) => {
    //           console.log(err);
    //
    //           this.generateErrorMessage(err, lang);
    //           this.stopLoaders();
    //
    //           return throwError(err);
    //           // return of(new HttpResponse({
    //           //   body: {
    //           //     data: null
    //           //   }
    //           // }));
    //         })
    //     ))
    // );
  }

  private generateErrorMessage(err: any, lang: string) {
    // generate error message here
    let errorMessage = Translate.Error.SomethingWrong[lang];

    if (err.status) {
      switch (err.status) {
        case HttpStatusCodes.FORBIDDEN: {
          errorMessage = Translate.Error.Forbidden[lang];
        }
        break;
        case HttpStatusCodes.UNAUTHORIZED: {
          errorMessage = Translate.Error.Unauthorized[lang];
        }
        break;
        default: {
          if (err?.error?.errors) {
            const errObj = err.error.errors;
            if (errObj?.GeneralErrors) {
              if (Array.isArray(errObj.GeneralErrors)) {
                errorMessage = '';
                errObj.GeneralErrors.forEach((msg) => {
                  errorMessage += `${msg} `;
                });
              } else if (typeof errObj?.GeneralErrors === 'string') {
                errorMessage = errObj.GeneralErrors
              }
            } else if (typeof errObj === 'string') {
              errorMessage = errObj;
            }
            console.log(err)
          } else if (err?.error?.message && typeof err.error.message === 'string') {
            errorMessage = err.error.message;
          } else if (err?.message && typeof err?.message === 'string') {
            errorMessage = err.message;
          }
        }
      }
    }

    this.notificationSvc.showError(errorMessage);
  }

  private stopLoaders() {
    this.loaderSvc.deactivate();
    this.loaderSvc.spinnerDeactivate();
  }
}

