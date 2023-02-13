import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, filter, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { APPOINTMENT_ID } from '../../../../shared/utils/const';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { Appointment } from '../../../../shared/models/appointment.model';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';

@Component({
  selector: 'dfm-view-appointment',
  templateUrl: './view-appointment.component.html',
  styleUrls: ['./view-appointment.component.scss'],
})
export class ViewAppointmentComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public appointment$$ = new BehaviorSubject<Appointment | undefined>(undefined);

  public rooms: string[] = [];

  constructor(
    private appointmentApiSvc: AppointmentApiService,
    private routerStateSvc: RouterStateService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private modalSvc: ModalService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.routerStateSvc
      .listenForParamChange$(APPOINTMENT_ID)
      .pipe(
        // filter((appointmentID) => !!appointmentID),
        switchMap((appointmentID) => this.appointmentApiSvc.getAppointmentByID(+appointmentID)),
        tap((appointment) => {
          this.appointment$$.next(appointment);

          if (appointment?.exams?.length) {
            const roomIdToName: { [key: string]: string } = {};

            appointment.exams.forEach((exam) => {
              if (exam.rooms?.length) {
                exam?.rooms.forEach((room) => {
                  if (!roomIdToName[room.id]) {
                    roomIdToName[room.id] = room.name;
                    this.rooms.push(room.name);
                  }
                });
              }
            });
          }
        }),
        // switchMap((appointment) => {
        //   if (appointment && appointment.id) {
        //
        //   }
        // }),
        takeUntil(this.destroy$$),
      )
      .subscribe((appointment) => {
        console.log(appointment);
      });
  }

  public deleteAppointment(id: number) {
    const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Appointment?',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    dialogRef.closed
      .pipe(
        filter((res: boolean) => res),
        take(1),
      )
      .subscribe(() => {
        this.appointmentApiSvc.deleteAppointment$(id);
        this.notificationSvc.showNotification('Appointment deleted successfully');
        this.router.navigate(['/', 'appointment']);
      });
  }
}
