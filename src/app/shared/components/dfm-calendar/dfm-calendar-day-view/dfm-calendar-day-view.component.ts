import { Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import {BehaviorSubject, filter, lastValueFrom, switchMap, take, takeUntil, tap} from 'rxjs';
import { DatePipe } from '@angular/common';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { NotificationType } from 'diflexmo-angular-design';
import { NameValue } from '../../search-modal.component';
import { AddAppointmentRequestData, Appointment, UpdateDurationRequestData, UpdateRadiologistRequestData } from '../../../models/appointment.model';
import { Exam } from '../../../models/exam.model';
import { CalenderTimeSlot, getDurationMinutes, Interval } from '../../../models/calendar.model';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../confirm-action-modal.component';
import { ChangeRadiologistModalComponent } from '../../../../modules/appointments/components/change-radiologist-modal/change-radiologist-modal.component';
import { AppointmentTimeChangeModalComponent } from '../../../../modules/appointments/components/appointment-time-change-modal/appointment-time-change-modal.component';
import { ShareDataService } from '../../../../core/services/share-data.service';
import { getAddAppointmentRequestData } from '../../../utils/getAddAppointmentRequestData';
import { ReadStatus } from '../../../models/status.model';
import { AddAppointmentModalComponent } from '../../../../modules/appointments/components/add-appointment-modal/add-appointment-modal.component';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { Translate } from '../../../models/translate.model';
import { CalendarUtils } from 'src/app/shared/utils/calendar.utils';
import { ENG_BE } from 'src/app/shared/utils/const';
import { DestroyableComponent } from '../../destroyable.component';
import { PermissionService } from 'src/app/core/services/permission.service';
import { UserRoleEnum } from 'src/app/shared/models/user.model';

@Component({
  selector: 'dfm-calendar-day-view',
  templateUrl: './dfm-calendar-day-view.component.html',
  styleUrls: ['./dfm-calendar-day-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DfmCalendarDayViewComponent extends DestroyableComponent implements OnInit, OnChanges, OnDestroy {
  @HostListener('document:click')
  private onclick = () => this.handleDocumentClick();

  @Input()
  public changeDate$$ = new BehaviorSubject<number>(0);

  @Input()
  public headerList: NameValue[] = [];

  @Input()
  public newDate$$ = new BehaviorSubject<Date | null>(null);

  @Input()
  public timeSlot!: CalenderTimeSlot;

  @Input()
  public dataGroupedByDateAndRoom!: {
    [key: string]: {
      [key: number]: {
        appointment: Appointment;
        exams: Exam[];
      }[];
    };
  };

  @Input()
  public format24Hour = false;

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

  public grayOutSlot$$: BehaviorSubject<any[]> = new BehaviorSubject<Interval[]>([]);

  private lastScrollTime: number = 0;

  private requestId: number | null = null;

  private selectedLang: string = ENG_BE;

  constructor(
    private datePipe: DatePipe,
    private appointmentApiSvc: AppointmentApiService,
    private notificationSvc: NotificationDataService,
    private modalSvc: ModalService,
    private shareDataSvc: ShareDataService,
    private staffApiSvc: StaffApiService,
    public permissionSvc: PermissionService,
  ) {
    super();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (!this.selectedDate) {
      this.updateDate(new Date());
    }

    const currentValue = changes['dataGroupedByDateAndRoom']?.currentValue;
    const previousValue = changes['dataGroupedByDateAndRoom']?.previousValue;

    if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
      this.dataGroupedByDateAndRoom = currentValue;
    }

    this.grayOutSlot$$.next([]);
    this.getGrayOutArea(this.timeSlot);
  }

  public ngOnInit(): void {
    this.changeDate$$
      .asObservable()
      .pipe(filter((offset) => !!offset))
      .subscribe({
        next: (offset) => this.changeDate(offset)
      });

    this.newDate$$
      .asObservable()
      .pipe()
      .subscribe({
        next: (date) => {
          if (date) {
            this.updateDate(date);
          }
        }
      });

    this.shareDataSvc
      .getDate$()
      .pipe(filter((date) => !!date))
      .subscribe({
        next: (date) => this.newDate$$.next(new Date(date))
      });

    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe({
        next: (lang) => this.selectedLang = lang
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  private changeDate(offset: number) {
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
    // const startHour = new Date(groupedData[0].startedAt).getHours();
    // const startMinute = new Date(groupedData[0].startedAt).getMinutes();
    // const barHeight = 1;
    // const horizontalBarHeight = (this.getHeight(groupedData) / (this.pixelsPerMin * this.timeInterval)) * barHeight;
    // const top = (startMinute + startHour * 60) * this.pixelsPerMin - horizontalBarHeight;
    const start = this.myDate(this.timeSlot.timings[0]);
    const end = new Date(groupedData[0].startedAt);
    const minutes = getDurationMinutes(start, end);
    return minutes * this.pixelsPerMin;
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
    const modalRef = this.modalSvc.open(ChangeRadiologistModalComponent, {
      data: appointment,
    });

    modalRef.closed
      .pipe(
        filter((res) => !!res),
        switchMap((ids: number[]) => {
          const requestData = {
            appointmentId: appointment.id,
            examId: appointment.exams[0].id,
            userId: ids,
          } as UpdateRadiologistRequestData;

          return this.appointmentApiSvc.updateRadiologist$(requestData);
        }),
        take(1),
      )
      .subscribe({
        next: () => this.notificationSvc.showNotification(`${Translate.SuccessMessage.Updated}!`)
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
            appointmentId: appointment.id,
            examId: appointment.exams[0].id,
          } as UpdateDurationRequestData;

          eventContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return this.appointmentApiSvc.updateAppointmentDuration$(requestData);
        }),
        take(1),
      )
      .subscribe({
        next: (res) => {},
        error: (err) => {
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
      } as ConfirmActionModalData,
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
      .subscribe({
        next: () => this.notificationSvc.showNotification('Appointment has been read')
      });
  }

  public deleteAppointment(id: number) {
    const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'AreYouSureWantToDeleteAppointment',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as ConfirmActionModalData,
    });

    dialogRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => this.appointmentApiSvc.deleteAppointment$(+id)),
        take(1),
      )
      .subscribe({
        next: (res) => this.notificationSvc.showNotification(`${Translate.SuccessMessage.Deleted[this.selectedLang]}!`)
      });
  }

  public async addAppointment(e: MouseEvent, eventsContainer: HTMLDivElement) {
    const permissionType = await lastValueFrom(this.permissionSvc.permissionType$);
    if (permissionType === UserRoleEnum.Reader) return;

    if (!e.offsetY) return;

    const isGrayOutArea = this.grayOutSlot$$.value.some((value) => e.offsetY >= value.top && e.offsetY <= value.top + value.height);
    const eventCard = this.createAppointmentCard(e, eventsContainer);

    if (isGrayOutArea) {
      this.modalSvc
        .open(ConfirmActionModalComponent, {
          data: {
            titleText: 'AddAppointmentConfirmation',
            bodyText: 'AreYouSureWantToMakeAppointmentOutsideOperatingHours',
            confirmButtonText: 'Yes',
          } as ConfirmActionModalData,
        })
        .closed.pipe(
          tap((value) => {
            if (!value) eventCard.remove();
          }),
          filter(Boolean),
          switchMap(() => {
            return this.modalSvc.open(AddAppointmentModalComponent, {
              data: {
                event: e,
                element: eventCard,
                elementContainer: eventsContainer,
                startedAt: this.selectedDate,
                startTime: this.timeSlot.timings[0],
              },
              options: {
                backdrop: false,
                centered: true,
                modalDialogClass: 'ad-ap-modal-shadow',
              },
            }).closed;
          }),
          take(1),
        )
        .subscribe({
          next: (res) => {
            eventCard.remove();
            if (res) {
              // show the created card
              // In progress
            }
          }
        });
    } else {
      this.modalSvc
        .open(AddAppointmentModalComponent, {
          data: {
            event: e,
            element: eventCard,
            elementContainer: eventsContainer,
            startedAt: this.selectedDate,
            startTime: this.timeSlot.timings[0],
          },
          options: {
            backdrop: false,
            centered: true,
            modalDialogClass: 'ad-ap-modal-shadow',
          },
        })
        .closed.pipe(take(1))
        .subscribe({
          next: (res) => {
            eventCard.remove();
            if (res) {
              // show the created card
              // In progress
            }
          }
        });
    }
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

  public onScroll(scrolledElement: HTMLElement, targetElement: HTMLElement) {
    const now = performance.now();

    if (!this.lastScrollTime || now - this.lastScrollTime > 16) {
      // eslint-disable-next-line no-param-reassign
      targetElement.scrollLeft = scrolledElement.scrollLeft;
      // eslint-disable-next-line no-param-reassign
      targetElement.scrollTop = scrolledElement.scrollTop;

      this.lastScrollTime = now;
    } else if (!this.requestId) {
      this.requestId = window.requestAnimationFrame(() => {
        // eslint-disable-next-line no-param-reassign
        targetElement.scrollLeft = scrolledElement.scrollLeft;
        // eslint-disable-next-line no-param-reassign
        targetElement.scrollTop = scrolledElement.scrollTop;
        this.lastScrollTime = performance.now();
        this.requestId = null;
      });
    }
  }

  private getGrayOutArea(timeSlot: CalenderTimeSlot) {
    const intervals = timeSlot?.intervals;
    const timings = timeSlot?.timings;
    if (!timings?.length) return;
    const grayOutSlot: any = [];
    grayOutSlot.push({
      dayStart: timings[0],
      dayEnd: timings[0],
      top: 0,
      height: 120 * this.pixelsPerMin,
    });
    const dayStart = this.subtractMinutes(105, timings[timings.length - 1]);
    const startTime = this.myDate(this.timeSlot.timings[0]);
    const endTime = this.myDate(dayStart);
    const lastMinutes = getDurationMinutes(startTime, endTime);

    grayOutSlot.push({
      dayStart,
      dayEnd: timings[timings.length - 1],
      top: lastMinutes * this.pixelsPerMin,
      height: 120 * this.pixelsPerMin,
    });

    if (intervals?.length > 1) {
      for (let i = 0; i < intervals.length - 1; i++) {
        const start = this.myDate(this.timeSlot.timings[0]);
        const end = this.myDate(intervals[i].dayEnd);
        const minutes = getDurationMinutes(start, end);
        const timeInterval = getDurationMinutes(end, this.myDate(intervals[i + 1].dayStart));
        grayOutSlot.push({
          dayStart: intervals[i].dayEnd,
          dayEnd: intervals[i + 1].dayStart,
          top: minutes * this.pixelsPerMin,
          height: timeInterval * this.pixelsPerMin,
        });
      }
    }
    this.grayOutSlot$$.next([...grayOutSlot]);
  }

  private myDate(date: string): Date {
    const formattedDate = new Date();
    const splitDate = date.split(':');
    formattedDate.setHours(+splitDate[0]);
    formattedDate.setMinutes(+splitDate[1]);
    formattedDate.setSeconds(0);
    return formattedDate;
  }

  private subtractMinutes(minutes: number, time: string): string {
    const date = new Date();
    const [hour, minute] = time.split(':');
    date.setHours(+hour);
    date.setMinutes(+minute);
    date.setSeconds(0);
    const subtractedDate = new Date(date.getTime() - minutes * 60 * 1000);
    return this.datePipe.transform(subtractedDate, 'HH:mm') ?? '';
  }
}
