import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, map, Observable, of, take, takeUntil } from 'rxjs';
import { PracticeHoursApiService } from 'src/app/core/services/practice-hours-api.service';
import { PrioritySlotApiService } from 'src/app/core/services/priority-slot-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { RepeatType } from 'src/app/shared/models/absence.model';
import { getDateOfMonth } from 'src/app/shared/models/calendar.model';
import { PrioritySlot } from 'src/app/shared/models/priority-slots.model';
import { get24HourTimeString, timeToNumber } from 'src/app/shared/utils/time';
import { CustomDateParserFormatter } from '../../../../shared/utils/dateFormat';

@Component({
  selector: 'dfm-priority-slots-calendar-view',
  templateUrl: './priority-slots-calendar-view.component.html',
  styleUrls: ['./priority-slots-calendar-view.component.scss'],
  providers: [{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }],
})
export class PrioritySlotsCalendarViewComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public selectedDate$$: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());

  public dataControl = new FormControl();

  public changeWeek$$ = new BehaviorSubject<number>(0);

  public newDate$$ = new BehaviorSubject<Date | null>(null);

  public prioritySlots$$: BehaviorSubject<any>;

  public practiceHourMinMax$: Observable<{ min: string; max: string } | null> = of(null);

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private priorityApiSvc: PrioritySlotApiService,
    private practiceHourSvc: PracticeHoursApiService,
  ) {
    super();
    this.prioritySlots$$ = new BehaviorSubject<any>({});
  }

  public appointmentsGroupedByDateAndTIme: { [key: string]: any[][] } = {};

  ngOnInit() {
    this.dataControl.valueChanges.pipe(takeUntil(this.destroy$$)).subscribe((value: any) => {
      const date = new Date(value.year, value.month - 1, value.day);
      this.updateDate(date);
      this.newDate$$.next(date);
    });

    this.priorityApiSvc.prioritySlots$.pipe(takeUntil(this.destroy$$)).subscribe((prioritySlots) => {
      this.setPrioritySlots(prioritySlots);
    });

    this.practiceHourMinMax$ = this.practiceHourSvc.practiceHours$.pipe(take(1)).pipe(
      map((value) =>
        value.reduce((pre: any, curr) => {
          let finalValue = { ...pre };
          if (!pre?.min || !pre?.max) {
            finalValue = { min: curr.dayStart, max: curr.dayEnd };
            return finalValue;
          }
          if (timeToNumber(curr.dayStart) <= timeToNumber(pre?.min)) {
            finalValue = { ...finalValue, min: curr.dayStart };
          }
          if (timeToNumber(curr.dayEnd) >= timeToNumber(pre?.max)) {
            finalValue = { ...finalValue, max: curr.dayEnd };
          }
          return finalValue;
        }, {}),
      ),
    );
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public updateDate(newDate: Date) {
    this.selectedDate$$.next(new Date(newDate));
    this.updateQuery('', newDate);
  }

  public updateToToday() {
    if (this.selectedDate$$.value?.toDateString() !== new Date().toDateString()) {
      this.newDate$$.next(new Date());
    }
  }

  public changeDate(offset: number) {
    this.changeWeek$$.next(offset);
  }

  public changeToDayView(date: number) {
    const newDate = new Date(this.selectedDate$$.value.setDate(date));
    this.newDate$$.next(newDate);
    this.selectedDate$$.next(new Date(newDate));
  }

  private updateQuery(queryStr?: string, date?: Date) {
    this.router.navigate([], {
      queryParams: {
        ...(queryStr ? { v: queryStr } : {}),
        ...(date ? { d: this.datePipe.transform(date, 'yyyy-MM-dd') } : {}),
      },
      queryParamsHandling: 'merge',
    });
  }

  private setPrioritySlots(prioritySlots: PrioritySlot[]) {
    const myPrioritySlots = {};
    prioritySlots.forEach((prioritySlot: PrioritySlot) => {
      let { repeatFrequency } = prioritySlot;
      const { priority } = prioritySlot;
      const startDate = new Date(new Date(prioritySlot.startedAt).toDateString());
      let firstDate = new Date(new Date(prioritySlot.startedAt).toDateString());
      const lastDate = new Date(new Date(prioritySlot.endedAt).toDateString());
      switch (true) {
        case !prioritySlot.isRepeat:
        case prioritySlot.repeatType === RepeatType.Daily: {
          repeatFrequency = prioritySlot.isRepeat ? repeatFrequency : 1;
          while (true) {
            const dateString = this.datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
            const customPrioritySlot = { start: prioritySlot.slotStartTime.slice(0, 5), end: prioritySlot.slotEndTime?.slice(0, 5), priority };
            myPrioritySlots[dateString] = myPrioritySlots[dateString] ? [...myPrioritySlots[dateString], customPrioritySlot] : [customPrioritySlot];
            if (firstDate.getTime() >= lastDate.getTime()) break;
            firstDate.setDate(firstDate.getDate() + repeatFrequency);
          }
          break;
        }
        case prioritySlot.repeatType === RepeatType.Weekly: {
          const closestSunday = new Date(startDate.getTime() - startDate.getDay() * 24 * 60 * 60 * 1000);
          firstDate = new Date(closestSunday);
          while (true) {
            prioritySlot.repeatDays.split(',').forEach((day) => {
              firstDate.setTime(closestSunday.getTime());
              firstDate.setDate(closestSunday.getDate() + +day);
              if (firstDate.getTime() >= startDate.getTime() && firstDate.getTime() <= lastDate.getTime()) {
                const dateString = this.datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
                const customPrioritySlot = { start: prioritySlot.slotStartTime.slice(0, 5), end: prioritySlot.slotEndTime?.slice(0, 5), priority };
                myPrioritySlots[dateString] = myPrioritySlots[dateString]
                  ? [...myPrioritySlots[dateString], customPrioritySlot]
                  : [customPrioritySlot];
              }
            });
            if (closestSunday.getTime() >= lastDate.getTime()) break;
            closestSunday.setDate(closestSunday.getDate() + repeatFrequency * 7);
          }
          break;
        }
        case prioritySlot.repeatType === RepeatType.Monthly: {
          while (true) {
            prioritySlot.repeatDays.split(',').forEach((day) => {
              if (getDateOfMonth(firstDate.getFullYear(), firstDate.getMonth() + 1, 0) >= +day) {
                firstDate.setDate(+day);
                if (firstDate.getTime() >= startDate.getTime() && firstDate.getTime() <= lastDate.getTime()) {
                  const dateString = this.datePipe.transform(firstDate, 'd-M-yyyy') ?? '';
                  const customPrioritySlot = { start: prioritySlot.slotStartTime.slice(0, 5), end: prioritySlot.slotEndTime?.slice(0, 5), priority };
                  myPrioritySlots[dateString] = myPrioritySlots[dateString]
                    ? [...myPrioritySlots[dateString], customPrioritySlot]
                    : [customPrioritySlot];
                }
              }
            });
            if (firstDate.getTime() >= lastDate.getTime()) break;
            firstDate.setMonth(firstDate.getMonth() + repeatFrequency);
          }
          break;
        }
        default:
          break;
      }
    });
    this.prioritySlots$$.next({ ...myPrioritySlots });
  }
}



























































