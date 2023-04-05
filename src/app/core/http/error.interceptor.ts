import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";
import {NotificationDataService} from "../services/notification-data.service";
import {NotificationType} from "diflexmo-angular-design";
import {LoaderService} from "../services/loader.service";
import {HttpStatusCodes} from "../../shared/models/base-response.model";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private notificationSvc: NotificationDataService, private loaderSvc: LoaderService) {
  }

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err) => {
        console.log(err);

        this.generateErrorMessage(err);
        this.stopLoaders();

        return throwError(err);
      })
    )
  }

  private generateErrorMessage(err: any) {
    // generate error message here
    let errorMessage = 'Something Went Wrong';

    if (err.status) {
      switch (err.status) {
        case HttpStatusCodes.FORBIDDEN: {
          errorMessage = 'Forbidden! You are not permitted to perform this action';
        }
        break;
        case HttpStatusCodes.UNAUTHORIZED: {
          errorMessage = 'Unauthorized! You are not authorized';
        }
        break;
        default: {
          if (err?.message && typeof err?.message === 'string') {
            errorMessage = err.message;
          } else if (err?.error?.message && typeof err.error.message === 'string') {
            errorMessage = err.error.message;
          }
        }
      }
    }

    this.notificationSvc.showNotification(errorMessage, NotificationType.DANGER);
  }

  private stopLoaders() {
    this.loaderSvc.deactivate();
    this.loaderSvc.spinnerDeactivate();
  }
}
