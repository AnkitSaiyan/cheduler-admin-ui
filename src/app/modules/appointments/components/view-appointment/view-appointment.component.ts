import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Exam } from '../../../../shared/models/exam.model';
import { TimeSlot, Weekday, WeekWisePracticeAvailability } from '../../../../shared/models/calendar.model';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { APPOINTMENT_ID, EXAM_ID } from '../../../../shared/utils/const';
import { User, UserType } from '../../../../shared/models/user.model';
import { PracticeAvailability } from '../../../../shared/models/practice.model';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { Appointment } from '../../../../shared/models/appointment.model';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { Room } from '../../../../shared/models/rooms.model';

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
        switchMap((appointmentID) => this.appointmentApiSvc.getAppointmentByID(+appointmentID)),
        takeUntil(this.destroy$$),
      )
      .subscribe((appointment) => {
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
