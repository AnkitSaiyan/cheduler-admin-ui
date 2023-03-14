import {DatePipe} from '@angular/common';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import { BehaviorSubject, combineLatest, debounceTime, filter, take, takeUntil, throttleTime } from 'rxjs';
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';
import { RoomsApiService } from 'src/app/core/services/rooms-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { getDurationMinutes } from 'src/app/shared/models/calendar.model';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { Appointment } from '../../../../shared/models/appointment.model';
import { Exam } from '../../../../shared/models/exam.model';
import { Router } from '@angular/router';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { AppointmentStatus } from '../../../../shared/models/status.model';
import { PracticeHoursApiService } from '../../../../core/services/practice-hours-api.service';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { CalendarUtils } from '../../../../shared/utils/calendar.utils';
import { get24HourTimeString, timeToNumber } from '../../../../shared/utils/time';
import { PracticeAvailabilityServer } from '../../../../shared/models/practice.model';
import { getNumberArray } from '../../../../shared/utils/getNumberArray';

@Component({
  selector: 'dfm-appointment-calendar',
  templateUrl: './appointment-calendar.component.html',
  styleUrls: ['./appointment-calendar.component.scss'],
})
export class AppointmentCalendarComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public calendarViewFormControl = new FormControl();

  public dataControl = new FormControl();

  public selectedDate$$: BehaviorSubject<Date> = new BehaviorSubject<Date>(new Date());

  public calendarViewType: NameValue[] = [
    {
      name: 'Day',
      value: 'day',
    },
    {
      name: 'Week',
      value: 'week',
    },
    {
      name: 'Month',
      value: 'month',
    },
  ];

  public changeDate$$ = new BehaviorSubject<number>(0);

  public changeWeek$$ = new BehaviorSubject<number>(0);

  public changeMonth$$ = new BehaviorSubject<number>(0);

  public newDate$$ = new BehaviorSubject<Date | null>(null);

  public headerList: NameValue[] = [];

  public appointmentsGroupedByDate: { [key: string]: Appointment[] } = {};

  public appointmentsGroupedByDateAndTIme: { [key: string]: any[][] } = {};

  private appointments$$: BehaviorSubject<any[]>;

  public filteredAppointments$$: BehaviorSubject<any[]>;

  public selectedSlot$$: BehaviorSubject<any>;

  private weekdayToPractice$$ = new BehaviorSubject<any>(null);

  appointmentGroupedByDateAndRoom: {
    [key: string]: {
      [key: number]: {
        appointment: Appointment;
        exams: Exam[];
      }[];
    };
  } = {};

  public paramsToCalendarView = {
    m: 'month',
    w: 'week',
    d: 'day',
  };

  constructor(
    private roomApiSvc: RoomsApiService,
    private datePipe: DatePipe,
    private appointmentApiSvc: AppointmentApiService,
    private router: Router,
    private routerStateSvc: RouterStateService,
    private practiceHoursApiSvc: PracticeHoursApiService,
    private timeIntervalPipe: TimeInIntervalPipe,
  ) {
    super();
    this.appointments$$ = new BehaviorSubject<any[]>([]);
    this.filteredAppointments$$ = new BehaviorSubject<any[]>([]);
    this.selectedSlot$$ = new BehaviorSubject<any>(null);
  }

  public ngOnInit(): void {
    this.routerStateSvc
      .listenForQueryParamsChanges$()
      .pipe(debounceTime(100), take(1))
      .subscribe((params) => {
        if (params['v'] !== 't') {
          this.calendarViewFormControl.setValue(this.paramsToCalendarView[params['v']]);
        }

        if (!params['d']) {
          this.updateQuery('', this.selectedDate$$.value);
        } else {
          const dateSplit = params['d'].split('-');
          if (dateSplit.length === 3) {
            const date = new Date(dateSplit[0], dateSplit[1] - 1, dateSplit[2]);
            this.newDate$$.next(date);
            this.selectedDate$$.next(date);
          }
        }
      });

    this.practiceHoursApiSvc.practiceHours$.pipe(takeUntil(this.destroy$$)).subscribe((practiceHours) => {
      this.createTimeInterval(practiceHours);
    });

    this.appointmentApiSvc.appointment$.pipe(takeUntil(this.destroy$$)).subscribe((appointments) => {
      this.appointments$$.next(appointments);
      this.filteredAppointments$$.next(appointments);

      const filteredAps = [...appointments].sort((ap1, ap2) => {
        if (ap1.startedAt && ap2.startedAt) {
          return new Date(ap1?.startedAt).getTime() - new Date(ap2?.startedAt).getTime();
        }

        return -1;
      });

      this.groupAppointmentsForCalendar(...filteredAps);
      this.groupAppointmentByDateAndRoom(...filteredAps);
    });

    this.calendarViewFormControl.valueChanges
      .pipe(
        filter((v) => !!v),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => {
        this.newDate$$.next(this.selectedDate$$.value);
        this.updateQuery(value[0]);
      });

    // this.calendarViewFormControl.setValue('day');

    this.roomApiSvc.allRooms$.pipe(takeUntil(this.destroy$$)).subscribe((rooms) => {
      this.headerList = rooms.map(({ name, id }) => ({ name, value: id }));
    });

    this.dataControl.valueChanges.pipe(takeUntil(this.destroy$$)).subscribe((value) => {
      const date = new Date(value.year, value.month - 1, value.day);
      this.updateDate(date);
      this.newDate$$.next(date);
    });

    combineLatest([this.selectedDate$$, this.weekdayToPractice$$])
      .pipe(
        filter(([_, weekdayToPractice]) => this.calendarViewFormControl.value === 'day' && weekdayToPractice),
        throttleTime(200),
        takeUntil(this.destroy$$),
      )
      .subscribe(([value]) => {
        this.selectedSlot$$.next(this.weekdayToPractice$$.value[value.getDay()]);
      });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public updateDate(newDate: Date) {
    this.selectedDate$$.next(new Date(newDate));
    this.updateQuery('', newDate);
  }

  public changeDate(offset: number) {
    switch (this.calendarViewFormControl.value) {
      case 'day':
        this.changeDate$$.next(offset);
        break;
      case 'week':
        this.changeWeek$$.next(offset);
        break;
      case 'month':
        this.changeMonth$$.next(offset);
        break;
      default:
    }
  }

  public changeToDayView(date: number) {
    this.calendarViewFormControl.setValue('day');
    const newDate = new Date(this.selectedDate$$.value.setDate(date));
    this.newDate$$.next(newDate);
    this.selectedDate$$.next(new Date(newDate));
  }

  public updateToToday() {
    if (this.selectedDate$$.value?.toDateString() !== new Date().toDateString()) {
      this.newDate$$.next(new Date());
    }
  }

  private groupAppointmentsForCalendar(...appointments: Appointment[]) {
    let startDate: Date;
    let endDate: Date;
    // let group: number;
    let sameGroup: boolean;
    let groupedAppointments: Appointment[] = [];
    let lastDateString: string;

    this.appointmentsGroupedByDate = {};
    this.appointmentsGroupedByDateAndTIme = {};
    this.appointmentGroupedByDateAndRoom = {};

    appointments.push({} as Appointment);
    appointments.forEach((appointment, index) => {
      if (Object.keys(appointment).length && appointment.exams?.length && appointment.startedAt) {
        const dateString = this.datePipe.transform(new Date(appointment.startedAt), 'd-M-yyyy');

        if (dateString) {
          if (!this.appointmentsGroupedByDate[dateString]) {
            this.appointmentsGroupedByDate[dateString] = [];
          }

          if (!this.appointmentsGroupedByDateAndTIme[dateString]) {
            this.appointmentsGroupedByDateAndTIme[dateString] = [];

            startDate = new Date(appointment.startedAt);
            endDate = new Date(appointment.endedAt);
            // group = 0;
            sameGroup = false;
          } else {
            const currSD = new Date(appointment.startedAt);
            const currED = new Date(appointment.endedAt);

            if (currSD.getTime() === startDate.getTime() || (currSD > startDate && currSD < endDate) || currSD.getTime() === endDate.getTime()) {
              sameGroup = true;
              if (currED > endDate) {
                endDate = currED;
              }
            } else if (currSD > endDate && getDurationMinutes(endDate, currSD) <= 1) {
              sameGroup = true;
              if (currED > endDate) {
                endDate = currED;
              }
            } else {
              startDate = currSD;
              endDate = currED;
              sameGroup = false;
            }
          }

          if (!sameGroup) {
            // group++;

            if (index !== 0 && lastDateString) {
              this.appointmentsGroupedByDateAndTIme[lastDateString].push(groupedAppointments);
              groupedAppointments = [];
            }
          }

          lastDateString = dateString;

          groupedAppointments.push(appointment);
          this.appointmentsGroupedByDate[dateString].push(appointment);
        }
      } else if (lastDateString) {
        this.appointmentsGroupedByDateAndTIme[lastDateString].push(groupedAppointments);
      }
    });
  }

  private groupAppointmentByDateAndRoom(...appointmentsProps: Appointment[]) {
    const appointments: Appointment[] = [];
    appointmentsProps.forEach((appointment: Appointment) => {
      appointment.exams.forEach((exam) => {
        appointments.push({ ...appointment, startedAt: exam.startedAt, endedAt: exam.endedAt, exams: [exam] });
      });
    });

    appointments.forEach((appointment) => {
      if (appointment.startedAt) {
        const dateString = this.datePipe.transform(new Date(appointment.startedAt), 'd-M-yyyy');

        if (dateString) {
          if (!this.appointmentGroupedByDateAndRoom[dateString]) {
            this.appointmentGroupedByDateAndRoom[dateString] = {};
          }

          appointment.exams?.forEach((exam) => {
            exam.rooms?.forEach((room) => {
              if (!this.appointmentGroupedByDateAndRoom[dateString][room.id]) {
                this.appointmentGroupedByDateAndRoom[dateString][room.id] = [];
              }

              this.appointmentGroupedByDateAndRoom[dateString][room.id].push({
                appointment,
                exams: appointment.exams ?? [],
              });
            });
          });
        }
      }
    });
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

  private createTimeInterval(practiceHours: PracticeAvailabilityServer[]) {
    practiceHours.sort((p1, p2) => timeToNumber(get24HourTimeString(p1.dayStart)) - timeToNumber(get24HourTimeString(p2.dayStart)));

    const weekdayToPractice = {};

    practiceHours.forEach((p) => {
      if (!weekdayToPractice[p.weekday]) {
        weekdayToPractice[p.weekday] = { timings: [], intervals: [] };
      }

      weekdayToPractice[p.weekday].intervals.push({
        dayStart: get24HourTimeString(p.dayStart),
        dayEnd: get24HourTimeString(p.dayEnd),
      });
    });

    getNumberArray(6).forEach((weekday) => {
      const practiceData = weekdayToPractice[weekday];

      if (practiceData && practiceData.intervals.length) {
        const startTime = practiceData.intervals[0].dayStart;
        const endTime = practiceData.intervals[practiceData.intervals.length - 1].dayEnd;

        let startMinutes = CalendarUtils.DurationInMinFromHour(+startTime.split(':')[0], +startTime.split(':')[1]);
        let endMinutes = CalendarUtils.DurationInMinFromHour(+endTime.split(':')[0], +endTime.split(':')[1]);


        if (startMinutes - 120 > 0) {
          startMinutes -= 120;
        } else {
          startMinutes = 0;
        }

        if (endMinutes + 120 < 24 * 60) {
          endMinutes += 120;
        } else {
          endMinutes = 24 * 60;
        }



        const timings = this.timeIntervalPipe.transform(15, 24, false, startMinutes, endMinutes);

        weekdayToPractice[weekday].timings = [...timings];
      }
    });

    this.weekdayToPractice$$.next(weekdayToPractice);
  }
}
