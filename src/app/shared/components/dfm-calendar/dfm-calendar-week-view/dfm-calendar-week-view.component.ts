import {
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { BehaviorSubject, filter, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';
import { getAllDaysOfWeek, getDurationMinutes } from '../../../models/calendar.model';
import { DestroyableComponent } from '../../destroyable.component';

@Component({
  selector: 'dfm-calendar-week-view',
  templateUrl: './dfm-calendar-week-view.component.html',
  styleUrls: ['./dfm-calendar-week-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DfmCalendarWeekViewComponent extends DestroyableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChildren('eventContainer')
  private eventContainer!: QueryList<ElementRef>;

  @Input()
  public selectedDate!: Date;

  @Input()
  public changeWeek$$ = new BehaviorSubject<number>(0);

  @Input()
  public newDate$$ = new BehaviorSubject<Date | null>(null);

  @Input()
  public dataGroupedByDateAndTime!: { [key: string]: { group: number; data: any }[] };

  @Output()
  public selectedDateEvent = new EventEmitter<Date>();

  @Output()
  public dayViewEvent = new EventEmitter<number>();

  public daysOfWeekArr: number[] = [];

  public todayDate = new Date();

  // In minutes
  public timeInterval: number = 15;

  constructor(private datePipe: DatePipe) {
    super();
  }

  public ngOnChanges() {
    if (!this.selectedDate) {
      this.selectedDate = new Date();
    }
  }

  public ngOnInit(): void {
    this.updateCalendarDays();

    console.log(this.dataGroupedByDateAndTime);

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
    this.renderEvents();
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public changeWeek(offset: number) {
    if (offset !== 0) {
      const date = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + offset * 7));
      this.updateDate(date);
      this.changeWeek$$.next(0);
    }

    this.updateCalendarDays();
    this.renderEvents();
  }

  private updateCalendarDays() {
    this.daysOfWeekArr = getAllDaysOfWeek(this.selectedDate);
  }

  private updateDate(date: Date) {
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
    // debugger;
    if (this.dataGroupedByDateAndTime) {
      this.eventContainer.forEach((elementRef) => {
        const div = elementRef.nativeElement as HTMLDivElement;
        const dataArray = this.dataGroupedByDateAndTime[div.id] as { group: number; data: any }[];

        if (dataArray?.length) {
          console.log(dataArray);
          const pixelsPerMin = 4;
          const barHeight = 1;
          const title = 'Appointments';
          let groupNo = 1;
          let count = 0;
          let startedAt: Date;
          let endDate: Date | null;

          dataArray.forEach(({ group, data }, index) => {
            if (group === groupNo) {
              count++;
              console.log(endDate, data.endedAt);
              if (!endDate || new Date(data.endedAt) > endDate) {
                endDate = new Date(data.endedAt);
              }
            }

            if (
              dataArray.length === 1 ||
              index === dataArray.length - 1 ||
              (index + 1 < dataArray.length - 1 && dataArray[index + 1].group !== groupNo)
            ) {
              // Calculating height for event card
              const totalMinutes = getDurationMinutes(startedAt ?? data.startedAt, data.endedAt);
              const height = totalMinutes * pixelsPerMin;

              //  Calculating top for event card
              const startHour = new Date(startedAt ?? data.startedAt).getHours();
              const startMinute = new Date(startedAt ?? data.startedAt).getMinutes();
              // Number of horizontal bars in between
              const horizontalBarHeight = (height / (pixelsPerMin * this.timeInterval)) * barHeight;
              const top = (startMinute + startHour * 60) * pixelsPerMin - horizontalBarHeight;

              // Event elements
              const eventTitle = document.createElement('span');
              const titleTextNode = document.createTextNode(title);
              eventTitle.classList.add('calender-week-view-event-title');
              eventTitle.appendChild(titleTextNode);

              const eventTime = document.createElement('span');
              const timeText = `${this.datePipe.transform(startedAt ?? data.startedAt, 'hh:mm')} - ${this.datePipe.transform(endDate, 'hh:mm')}`;
              const timeTextNode = document.createTextNode(timeText);
              eventTime.classList.add('calender-week-view-event-time');
              eventTime.appendChild(timeTextNode);

              const eventDetailsContainer = document.createElement('div');
              eventDetailsContainer.classList.add('calender-week-view-event-details-container');
              eventDetailsContainer.append(eventTitle, eventTime);

              const circleIcon = document.createElement('div');
              const countTextNode = document.createTextNode(count.toString());
              circleIcon.classList.add('calender-week-view-event-circle-icon');
              circleIcon.appendChild(countTextNode);

              const eventContainer = document.createElement('div');
              eventContainer.classList.add('calender-week-view-event-container');
              eventContainer.style.top = `${top}px`;
              eventContainer.style.height = `${height}px`;
              eventContainer.append(circleIcon, eventDetailsContainer);

              div.appendChild(eventContainer);

              count = 0;

              if (index + 1 < dataArray.length - 1 && dataArray[index + 1].group !== groupNo) {
                groupNo = dataArray[index + 1].group;
                startedAt = new Date(dataArray[index + 1].data.startedAt);
              } else {
                groupNo = 1;
              }

              endDate = null;
            }
          });
        }
      });
    }
  }
}
