import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { NotificationType } from 'diflexmo-angular-design';
import { NameValue } from '../../search-modal.component';
import { AddAppointmentRequestData, Appointment, UpdateDurationRequestData } from '../../../models/appointment.model';
import { Exam } from '../../../models/exam.model';
import { getDurationMinutes } from '../../../models/calendar.model';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ConfirmActionModalComponent, DialogData } from '../../confirm-action-modal.component';
import { ChangeRadiologistModalComponent } from '../../../../modules/appointments/components/change-radiologist-modal/change-radiologist-modal.component';
import { AppointmentTimeChangeModalComponent } from '../../../../modules/appointments/components/appointment-time-change-modal/appointment-time-change-modal.component';
import { ShareDataService } from '../../../../core/services/share-data.service';
import { getAddAppointmentRequestData } from '../../../utils/getAddAppointmentRequestData';
import { ReadStatus } from '../../../models/status.model';
import { AddAppointmentModalComponent } from '../../../../modules/appointments/components/add-appointment-modal/add-appointment-modal.component';
import { StaffApiService } from '../../../../core/services/staff-api.service';

@Component({
  selector: 'dfm-calendar-day-view',
  templateUrl: './dfm-calendar-day-view.component.html',
  styleUrls: ['./dfm-calendar-day-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DfmCalendarDayViewComponent implements OnInit, OnChanges {
  @HostListener('document:click')
  private onclick = () => this.handleDocumentClick();

  @Input()
  public changeDate$$ = new BehaviorSubject<number>(0);

  @Input()
  public headerList: NameValue[] = [];

  @Input()
  public newDate$$ = new BehaviorSubject<Date | null>(null);

  @Input()
  public dataGroupedByDateAndRoom!: {
    [key: string]: {
      [key: number]: {
        appointment: Appointment;
        exams: Exam[];
      }[];
    };
  };

  @Output()
  public selectedDateEvent = new EventEmitter<Date>();

  @Output()
  public deleteAppointmentEvent = new EventEmitter<number>();

  public selectedDate!: Date;

  public selectedDateOnly!: number;

  public todayDate = new Date();

  public dateString!: string;

  public readonly timeInterval: number = 15;

  public readonly pixelsPerMin: number = 4;

  public lastOpenedMenuRef!: NgbDropdown | null;

  public addingAppointment = false;

  constructor(
    private datePipe: DatePipe,
    private appointmentApiSvc: AppointmentApiService,
    private notificationSvc: NotificationDataService,
    private modalSvc: ModalService,
    private shareDataSvc: ShareDataService,
    private staffApiSvc: StaffApiService,
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (!this.selectedDate) {
      this.updateDate(new Date());
    }

    const currentValue = changes['dataGroupedByDateAndRoom']?.currentValue;
    const previousValue = changes['dataGroupedByDateAndRoom']?.previousValue;

    if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
      this.dataGroupedByDateAndRoom = currentValue;
    }
  }

  public ngOnInit(): void {
    console.log(this.dataGroupedByDateAndRoom);
    this.changeDate$$
      .asObservable()
      .pipe(filter((offset) => !!offset))
      .subscribe((offset) => {
        this.changeDate(offset);
      });

    this.newDate$$
      .asObservable()
      .pipe()
      .subscribe((date) => {
        if (date) {
          this.updateDate(date);
        }
      });

    this.shareDataSvc
      .getDate$()
      .pipe(filter((date) => !!date))
      .subscribe((date) => {
        this.newDate$$.next(new Date(date));
      });
  }

  private changeDate(offset: number) {
    console.log({ offset });
    if (this.selectedDate) {
      const date = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + offset));
      this.updateDate(date);
      this.emitDate();
    }
  }

  private updateDate(date: Date) {
    date.setMinutes(date.getMinutes() - (date.getMinutes() % 5));
    this.selectedDate = date;
    this.selectedDateOnly = date.getDate();
    const dateString = this.datePipe.transform(date, 'd-M-yyyy');
    if (dateString) {
      this.dateString = dateString;
    }
    this.emitDate();
  }

  private emitDate(): void {
    this.selectedDateEvent.emit(this.selectedDate);
  }

  public getHeight(groupedData: any[]): number {
    let endDate: Date = groupedData[0].endedAt;

    groupedData.forEach((data) => {
      if (data.endedAt > endDate) {
        endDate = data.endedAt;
      }
    });

    // debugger;
    const durationMinutes = getDurationMinutes(groupedData[0].startedAt, endDate);

    return durationMinutes * this.pixelsPerMin;
  }

  public getTop(groupedData: any[]): number {
    const startHour = new Date(groupedData[0].startedAt).getHours();
    const startMinute = new Date(groupedData[0].startedAt).getMinutes();
    const barHeight = 1;
    const horizontalBarHeight = (this.getHeight(groupedData) / (this.pixelsPerMin * this.timeInterval)) * barHeight;
    const top = (startMinute + startHour * 60) * this.pixelsPerMin - horizontalBarHeight;

    return top;
  }

  private handleDocumentClick() {
    // closing menu
    this.lastOpenedMenuRef?.close();
    this.lastOpenedMenuRef = null;
  }

  public toggleMoreMenu(moreMenu: NgbDropdown) {
    moreMenu.toggle();

    if (this.lastOpenedMenuRef && this.lastOpenedMenuRef !== moreMenu) {
      this.lastOpenedMenuRef.close();
    }

    if (this.lastOpenedMenuRef !== moreMenu) {
      this.lastOpenedMenuRef = moreMenu;
    }
  }

  public changeRadiologists(appointment: Appointment) {
    const modalRef = this.modalSvc.open(ChangeRadiologistModalComponent);

    modalRef.closed
      .pipe(
        filter((res) => !!res),
        switchMap((id) => {
          const requestData = { ...getAddAppointmentRequestData(appointment, true, { userId: id }) };
          return this.appointmentApiSvc.updateAppointment$(requestData);
        }),
        take(1),
      )
      .subscribe((res) => {
        console.log(res);
        this.notificationSvc.showNotification('Radiologist updated');
      });
  }

  public openChangeTimeModal(appointment: Appointment, extend = true, eventContainer?: HTMLDivElement) {
    const top = eventContainer?.style.top;
    const height = eventContainer?.style.height;

    const modalRef = this.modalSvc.open(AppointmentTimeChangeModalComponent, {
      data: { extend, eventContainer },
    });

    modalRef.closed
      .pipe(
        filter((res) => !!res),
        switchMap((res) => {
          // Handled at backend will be removed once verified
          // const startedAt = new Date(appointment.startedAt);
          // const endedAt = new Date(appointment.endedAt);
          // const hour = Math.floor(+res.minutes / 60);
          // const min = +res.minutes % 60;
          //
          // if (res.top) {
          //   startedAt.setMinutes(startedAt.getMinutes() + min * (extend ? -1 : 1));
          //   if (hour) {
          //     startedAt.setHours(startedAt.getHours() + hour * (extend ? -1 : 1));
          //   }
          // } else {
          //   endedAt.setMinutes(endedAt.getMinutes() + min * (extend ? 1 : -1));
          //   if (hour) {
          //     endedAt.setHours(endedAt.getHours() + hour * (extend ? 1 : -1));
          //   }
          // }

          const requestData = {
            amountofMinutes: +res.minutes,
            extensionType: extend ? 'extend' : 'shorten',
            from: res.top ? 'AtTheTop' : 'AtTheBottom',
            id: appointment.id,
          } as UpdateDurationRequestData;

          eventContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return this.appointmentApiSvc.updateAppointmentDuration$(requestData);
        }),
        take(1),
      )
      .subscribe({
        next: (res) => {
          console.log(res);
        },
        error: (err) => {
          console.log(err);
          this.notificationSvc.showNotification(err?.error?.message, NotificationType.DANGER);
          if (eventContainer && top && height) {
            // eslint-disable-next-line no-param-reassign
            eventContainer.style.top = top;
            // eslint-disable-next-line no-param-reassign
            eventContainer.style.height = height;
          }
        },
      });
  }

  public readAppointment(appointment: Appointment) {
    const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Read Status Confirmation',
        confirmButtonText: 'Change',
        bodyText: `Are you sure you want to mark the appointment with Appointment No: ${appointment.id} as read?`,
      } as DialogData,
    });

    modalRef.closed
      .pipe(
        filter((res) => !!res),
        switchMap(() => {
          const requestData = {
            ...getAddAppointmentRequestData(appointment, true, { readStatus: ReadStatus.Read }),
          } as AddAppointmentRequestData;

          return this.appointmentApiSvc.updateAppointment$(requestData);
        }),
        take(1),
      )
      .subscribe((res) => {
        console.log(res);
        this.notificationSvc.showNotification('Appointment has been read');
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
        switchMap(() => this.appointmentApiSvc.deleteAppointment$(+id)),
        take(1),
      )
      .subscribe((res) => {
        console.log(res);
        this.notificationSvc.showNotification('Appointment deleted successfully');
      });
  }

  public addAppointment(e: MouseEvent, eventsContainer: HTMLDivElement) {
    const eventCard = this.createAppointmentCard(e, eventsContainer);

    const modalRef = this.modalSvc.open(AddAppointmentModalComponent, {
      data: {
        event: e,
        element: eventCard,
        elementContainer: eventsContainer,
        startedAt: this.selectedDate,
      },
      options: {
        backdrop: false,
        centered: true,
        modalDialogClass: 'ad-ap-modal-shadow',
      },
    });

    modalRef.closed.pipe(take(1)).subscribe((res) => {
      if (!res) {
        eventCard.remove();
      }
    });
  }

  private createAppointmentCard(e: MouseEvent, eventsContainer: HTMLDivElement): HTMLDivElement {
    const top = e.offsetY - (e.offsetY % 20);
    const eventCard = document.createElement('div');
    eventCard.classList.add('calender-day-view-event-container');
    eventCard.style.height = `20px`;
    eventCard.style.top = `${top}px`;

    const appointmentText = document.createElement('span');
    // const textNode = document.createTextNode('Appointment');

    appointmentText.innerText = 'Appointment';

    appointmentText.classList.add('appointment-title');

    eventCard.appendChild(appointmentText);
    eventsContainer.appendChild(eventCard);

    return eventCard;
  }
}
