import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { BehaviorSubject, filter, take } from 'rxjs';
import { DatePipe } from '@angular/common';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { NameValue } from '../../search-modal.component';
import { Appointment } from '../../../models/appointment.model';
import { Exam } from '../../../models/exam.model';
import { getDurationMinutes } from '../../../models/calendar.model';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ConfirmActionModalComponent, DialogData } from '../../confirm-action-modal.component';
import { ChangeRadiologistModalComponent } from '../../../../modules/appointments/components/change-radiologist-modal/change-radiologist-modal.component';

@Component({
  selector: 'dfm-calendar-day-view',
  templateUrl: './dfm-calendar-day-view.component.html',
  styleUrls: ['./dfm-calendar-day-view.component.scss'],
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

  constructor(
    private datePipe: DatePipe,
    private appointmentApiSvc: AppointmentApiService,
    private notificationSvc: NotificationDataService,
    private modalSvc: ModalService,
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (!this.selectedDate) {
      this.updateDate(new Date());
    }

    const { currentValue } = changes['dataGroupedByDateAndRoom'];
    const { previousValue } = changes['dataGroupedByDateAndRoom'];

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
  }

  private changeDate(offset: number) {
    if (this.selectedDate) {
      const date = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + offset));
      this.updateDate(date);
      this.emitDate();
    }
  }

  private updateDate(date: Date) {
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

  public readAppointment(id: number) {
    console.log(id);
    this.appointmentApiSvc.updateReadStatus(id);
    this.notificationSvc.showNotification('Appointment read status is updated');
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
        this.appointmentApiSvc.deleteAppointment(id);
        this.notificationSvc.showNotification('Appointment deleted successfully');
      });
  }

  private handleDocumentClick() {
    // closing menu
    this.lastOpenedMenuRef?.close();
    this.lastOpenedMenuRef = null;
  }

  public handleMoreButtonClick(moreMenu: NgbDropdown) {
    if (this.lastOpenedMenuRef && this.lastOpenedMenuRef.isOpen()) {
      this.lastOpenedMenuRef.close();
    }

    if (this.lastOpenedMenuRef === moreMenu) {
      this.lastOpenedMenuRef = null;
    }

    if (!this.lastOpenedMenuRef && this.lastOpenedMenuRef !== moreMenu) {
      this.lastOpenedMenuRef = moreMenu;
    }
  }

  public changeRadiologists(appointmentID: number) {
    const modalRef = this.modalSvc.open(ChangeRadiologistModalComponent);

    modalRef.closed
      .pipe(
        filter((res) => !!res),
        take(1),
      )
      .subscribe((id) => {
        this.appointmentApiSvc.changeRadiologist(appointmentID, id);
        this.notificationSvc.showNotification('Radiologist updated');
      });
  }
}
