import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  Renderer2,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { BehaviorSubject, filter, take, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';
import { getAllDaysOfWeek, getDurationMinutes } from '../../../models/calendar.model';
import { DestroyableComponent } from '../../destroyable.component';
import { AddAppointmentModalComponent } from '../../../../modules/appointments/components/add-appointment-modal/add-appointment-modal.component';
import { ModalService } from '../../../../core/services/modal.service';

// @Pipe({
//   name: 'calendarEventHeight',
//   standalone: true
// })
// class CalendarEventHeightPipe implements PipeTransform {
//   public transform(value: any[], pixelsPerMin: number): any {
//     let endDate: Date = value[0].endedAt;
//
//     value.forEach((data) => {
//       if (data.endedAt > endDate) {
//         endDate = data.endedAt;
//       }
//     });
//
//     const durationMinutes = getDurationMinutes(value[0].startedAt, endDate);
//
//     return durationMinutes * pixelsPerMin;
//   }
// }

@Component({
  selector: 'dfm-calendar-week-view',
  templateUrl: './dfm-calendar-week-view.component.html',
  styleUrls: ['./dfm-calendar-week-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DfmCalendarWeekViewComponent extends DestroyableComponent implements OnInit, OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {
  @ViewChildren('eventContainer')
  private eventContainer!: QueryList<ElementRef>;

  @Input()
  public selectedDate!: Date;

  @Input()
  public changeWeek$$ = new BehaviorSubject<number>(0);

  @Input()
  public newDate$$ = new BehaviorSubject<Date | null>(null);

  @Input()
  public dataGroupedByDateAndTime!: { [key: string]: any[][] };

  @Input()
  public prioritySlots!: { [key: string]: any[] };

  @Input()
  public format24Hour = false;

  @Output()
  public selectedDateEvent = new EventEmitter<Date>();

  @Output()
  public dayViewEvent = new EventEmitter<number>();

  @Output()
  public addAppointment = new EventEmitter<{ e: MouseEvent; eventsContainer: HTMLDivElement; day: number[] }>();

  public daysOfWeekArr: number[][] = [];

  public todayDate = new Date();

  // In minutes
  public readonly timeInterval: number = 15;

  public readonly pixelsPerMin: number = 4;

  public rendered = false;

  public getDurationFn = (s, e) => getDurationMinutes(s, e);

  constructor(private datePipe: DatePipe, private cdr: ChangeDetectorRef, private renderer: Renderer2, private modalSvc: ModalService) {
    super();
  }

  public ngOnChanges() {
    if (!this.selectedDate) {
      this.selectedDate = new Date();
    }
    console.log(this.prioritySlots);
  }

  public ngOnInit(): void {
    this.updateCalendarDays();

    this.changeWeek$$
      .pipe(
        filter((offset) => !!offset),
        takeUntil(this.destroy$$),
      )
      .subscribe((offset) => {
        this.changeWeek(offset);
      });

    this.newDate$$
      .asObservable()
      .pipe()
      .subscribe((date) => {
        if (date) {
          this.updateDate(date);
          this.updateCalendarDays();
        }
      });
  }

  public ngAfterViewInit() {
    // this.renderEvents();
    this.rendered = true;
  }

  public ngAfterViewChecked() {
    if (!this.rendered) {
      // this.rendered = true;
      // this.renderEvents();
      // this.cdr.markForCheck();
    }
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public changeWeek(offset: number) {
    console.log(offset);
    if (offset !== 0) {
      const date = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + offset * 7));
      console.log('147', date);
      this.updateDate(date);
      this.changeWeek$$.next(0);
    }

    this.updateCalendarDays();
  }

  private updateCalendarDays() {
    // debugger;
    this.daysOfWeekArr = getAllDaysOfWeek(this.selectedDate);
    console.log(this.daysOfWeekArr);
    this.rendered = false;
  }

  private updateDate(date: Date) {
    date.setMinutes(date.getMinutes() - (date.getMinutes() % 5));
    this.selectedDate = date;
    this.emitDate();
  }

  private emitDate() {
    this.selectedDateEvent.emit(this.selectedDate);
  }

  public changeToDayView(day: number, weekday: number) {
    // updating month if selected date is of another month's
    if (day < this.selectedDate.getDate() && weekday > this.selectedDate.getDay()) {
      this.updateDate(new Date(this.selectedDate.setMonth(this.selectedDate.getMonth() + 1)));
    } else if (day > this.selectedDate.getDate() && weekday < this.selectedDate.getDay()) {
      this.updateDate(new Date(this.selectedDate.setMonth(this.selectedDate.getMonth() - 1)));
    }

    this.dayViewEvent.emit(day);
  }

  private renderEvents(): void {
    //   // debugger;
    //   if (this.dataGroupedByDateAndTime) {
    //
    //     this.eventContainer.forEach((elementRef) => {
    //       const div = elementRef.nativeElement as HTMLDivElement;
    //       const dataArray = this.dataGroupedByDateAndTime[div.id] as { group: number; data: any }[];
    //
    //       if (dataArray?.length) {
    //
    //         const pixelsPerMin = 4;
    //         const barHeight = 1;
    //         const title = 'Appointments';
    //         let groupNo = 1;
    //         let count = 0;
    //         let startedAt: Date;
    //         let endDate: Date | null;
    //
    //         dataArray.forEach(({ group, data }, index) => {
    //           if (group === groupNo) {
    //             count++;
    //             if (!endDate || new Date(data.endedAt) > endDate) {
    //               endDate = new Date(data.endedAt);
    //             }
    //           }
    //
    //           if (
    //             dataArray.length === 1 ||
    //             index === dataArray.length - 1 ||
    //             (index + 1 < dataArray.length - 1 && dataArray[index + 1].group !== groupNo)
    //           ) {
    //             // Calculating height for event card
    //             const totalMinutes = getDurationMinutes(startedAt ?? data.startedAt, data.endedAt);
    //             const height = totalMinutes * pixelsPerMin;
    //
    //             //  Calculating top for event card
    //             const startHour = new Date(startedAt ?? data.startedAt).getHours();
    //             const startMinute = new Date(startedAt ?? data.startedAt).getMinutes();
    //             // Number of horizontal bars in between
    //             const horizontalBarHeight = (height / (pixelsPerMin * this.timeInterval)) * barHeight;
    //             const top = (startMinute + startHour * 60) * pixelsPerMin - horizontalBarHeight;
    //
    //             // Event elements
    //             const eventTitle = document.createElement('span');
    //             const titleTextNode = document.createTextNode(title);
    //             eventTitle.classList.add('calender-week-view-event-title');
    //             eventTitle.appendChild(titleTextNode);
    //
    //             const eventTime = document.createElement('span');
    //             const timeText = `${this.datePipe.transform(startedAt ?? data.startedAt, 'hh:mm')} - ${this.datePipe.transform(endDate, 'hh:mm')}`;
    //             const timeTextNode = document.createTextNode(timeText);
    //             eventTime.classList.add('calender-week-view-event-time');
    //             eventTime.appendChild(timeTextNode);
    //
    //             const eventDetailsContainer = document.createElement('div');
    //             eventDetailsContainer.classList.add('calender-week-view-event-details-container');
    //             eventDetailsContainer.append(eventTitle, eventTime);
    //
    //             const circleIcon = document.createElement('div');
    //             const countTextNode = document.createTextNode(count.toString());
    //             circleIcon.classList.add('calender-week-view-event-circle-icon');
    //             circleIcon.appendChild(countTextNode);
    //
    //             const eventContainer = document.createElement('div');
    //             eventContainer.classList.add('calender-week-view-event-container');
    //             eventContainer.style.top = `${top}px`;
    //             eventContainer.style.height = `${height}px`;
    //             eventContainer.append(circleIcon, eventDetailsContainer);
    //
    //             div.appendChild(eventContainer);
    //
    //             count = 0;
    //
    //             if (index + 1 < dataArray.length - 1 && dataArray[index + 1].group !== groupNo) {
    //               groupNo = dataArray[index + 1].group;
    //               startedAt = new Date(dataArray[index + 1].data.startedAt);
    //             } else {
    //               groupNo = 1;
    //             }
    //
    //             endDate = null;
    //           }
    //         });
    //       }
    //     });
    //   }
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

  public getPrioritySlotHeight(prioritySlot: any): number {
    const startDate: Date = this.myDate(prioritySlot.start);
    const endDate: Date = this.myDate(prioritySlot.end);
    const durationMinutes = getDurationMinutes(startDate, endDate);
    return durationMinutes * this.pixelsPerMin;
  }

  public getTop(groupedData: any[]): number {
    const startHour = new Date(groupedData[0].startedAt).getHours();
    const startMinute = new Date(groupedData[0].startedAt).getMinutes();
    const barHeight = 1;
    const horizontalBarHeight = (this.getHeight(groupedData) / (this.pixelsPerMin * this.timeInterval)) * barHeight;
    const top = (startMinute + startHour * 60) * this.pixelsPerMin - horizontalBarHeight;
    if (top % 20) {
      return Math.floor(top / 20) * 20 + 20;
    }
    return top;
  }

  public getPrioritySlotTop(prioritySlot: any): number {
    const startDate = this.myDate(prioritySlot.start);
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const barHeight = 1;
    const horizontalBarHeight = (this.getPrioritySlotHeight(prioritySlot) / (this.pixelsPerMin * this.timeInterval)) * barHeight;
    const top = (startMinute + startHour * 60) * this.pixelsPerMin - horizontalBarHeight;
    if (top % 20) {
      return Math.floor(top / 20) * 20 + 20;
    }
    return top;
  }

  public onDblClick(e: MouseEvent, eventsContainer: HTMLDivElement, day: number[]) {
    this.addAppointment.emit({ e, eventsContainer, day });
  }

  private myDate(date: string): Date {
    const formattedDate = new Date();
    const splitDate = date.split(':');
    formattedDate.setHours(+splitDate[0]);
    formattedDate.setMinutes(+splitDate[1]);
    formattedDate.setSeconds(0);
    return formattedDate;
  }
}
