import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';
import { RoomsApiService } from 'src/app/core/services/rooms-api.service';
import { DestroyableComponent } from 'src/app/shared/components/destroyable.component';
import { getDurationMinutes } from 'src/app/shared/models/calendar.model';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { Appointment } from '../../../../shared/models/appointment.model';
import { Exam } from '../../../../shared/models/exam.model';

@Component({
  selector: 'dfm-appointment-calendar',
  templateUrl: './appointment-calendar.component.html',
  styleUrls: ['./appointment-calendar.component.scss'],
})
export class AppointmentCalendarComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public calendarViewFormControl = new FormControl();

  public selectedDate: Date = new Date();

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

  appointmentGroupedByDateAndRoom: {
    [key: string]: {
      [key: number]: {
        appointment: Appointment;
        exams: Exam[];
      }[];
    };
  } = {};

  constructor(private roomApiSvc: RoomsApiService, private datePipe: DatePipe, private appointmentApiSvc: AppointmentApiService) {
    super();
    this.appointments$$ = new BehaviorSubject<any[]>([]);
    this.filteredAppointments$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
    this.calendarViewFormControl.setValue('week');

    this.calendarViewFormControl.valueChanges.pipe().subscribe((value) => {
      this.newDate$$.next(this.selectedDate);
    });

    this.appointmentApiSvc.appointment$.pipe(takeUntil(this.destroy$$)).subscribe((appointments) => {
      console.log('appointments: ', appointments);
      this.appointments$$.next(appointments);
      this.filteredAppointments$$.next(appointments);

      appointments.sort((ap1, ap2) => new Date(ap1?.startedAt).getTime() - new Date(ap2?.startedAt).getTime());

      console.log(appointments);

      this.groupAppointmentsForCalendar(...appointments);
      this.groupAppointmentByDateAndRoom(...appointments);

      console.log(this.appointmentsGroupedByDate);
    });

    this.roomApiSvc.rooms$.pipe(takeUntil(this.destroy$$)).subscribe((rooms) => {
      this.headerList = rooms.map(({ name, id }) => ({ name, value: id }));
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public updateDate(newDate: Date) {
    this.selectedDate = new Date(newDate);
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
    const newDate = new Date(this.selectedDate.setDate(date));
    this.newDate$$.next(newDate);
    this.selectedDate = new Date(newDate);
  }

  public updateToToday() {
    if (this.selectedDate?.toDateString() !== new Date().toDateString()) {
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
      if (Object.keys(appointment).length && appointment.exams?.length) {
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

            if (index !== 0) {
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

    console.log({ appointments });

    appointments.forEach((appointment) => {
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
    });
    console.log('test', this.appointmentGroupedByDateAndRoom);
  }
}
