import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { User, UserType } from '../../../../shared/models/user.model';
import { TimeSlot, Weekday, WeekWisePracticeAvailability } from '../../../../shared/models/calendar.model';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { EXAM_ID } from '../../../../shared/utils/const';
import { PracticeAvailability } from '../../../../shared/models/practice.model';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { Exam, Uncombinables } from '../../../../shared/models/exam.model';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { get24HourTimeString, timeToNumber } from '../../../../shared/utils/time';

@Component({
  selector: 'dfm-view-exam',
  templateUrl: './view-exam.component.html',
  styleUrls: ['./view-exam.component.scss'],
})
export class ViewExamComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public examDetails$$ = new BehaviorSubject<Exam | undefined>(undefined);

  public uncombinablesExam$$ = new BehaviorSubject<Uncombinables[]>([]);

  public staffsGroupedByTypes: {
    mandatory: NameValue[];
    radiologists: NameValue[];
    assistants: NameValue[];
    nursing: NameValue[];
    secretaries: NameValue[];
  } = {
    mandatory: [],
    radiologists: [],
    assistants: [],
    nursing: [],
    secretaries: [],
  };

  public practiceAvailability$$ = new BehaviorSubject<any[]>([]);

  public columns: Weekday[] = [Weekday.MON, Weekday.TUE, Weekday.WED, Weekday.THU, Weekday.FRI, Weekday.SAT, Weekday.SUN];

  constructor(
    private staffApiSvc: StaffApiService,
    private examApiService: ExamApiService,
    private roomApiService: RoomsApiService,
    private routerStateSvc: RouterStateService,
    private examApiSvc: ExamApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private modalSvc: ModalService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.routerStateSvc
      .listenForParamChange$(EXAM_ID)
      .pipe(
        switchMap((examID) => this.examApiService.getExamByID(+examID)),
        takeUntil(this.destroy$$),
      )
      .subscribe((exam) => {
        this.examDetails$$.next(exam);
        this.uncombinablesExam$$.next(exam?.uncombinablesExam ?? []);
        if (exam?.practiceAvailability?.length) {
          this.practiceAvailability$$.next([...this.getPracticeAvailability(exam.practiceAvailability)]);
        }

        if (exam?.users?.length) {
          this.saveStaffDetails(exam.users);
        }
      });
  }

  private saveStaffDetails(users: User[]) {
    users.forEach((user) => {
      const nameValue: NameValue = {
        name: `${user.firstname} ${user.lastname}`,
        value: user.id,
      };
      if (user.isMandate) {
        this.staffsGroupedByTypes.mandatory.push(nameValue);
      } else {
        switch (user.userType) {
          case UserType.Assistant:
            this.staffsGroupedByTypes.assistants.push(nameValue);
            break;
          case UserType.Radiologist:
            this.staffsGroupedByTypes.radiologists.push(nameValue);
            break;
          case UserType.Nursing:
            this.staffsGroupedByTypes.nursing.push(nameValue);
            break;
          case UserType.Secretary:
          case UserType.Scheduler:
            this.staffsGroupedByTypes.secretaries.push(nameValue);
            break;
          default:
          // this.staffsGroupedByTypes.mandatory.push(nameValue);
        }
      }
    });
  }

  private getPracticeAvailability(practiceAvailabilities: PracticeAvailability[]): WeekWisePracticeAvailability[] {
    const weekdayToSlotsObj: { [key: string]: TimeSlot[] } = {};

    const practiceAvailability: WeekWisePracticeAvailability[] = [];

    // creating week-wise slots
    practiceAvailabilities.forEach((practice) => {
      const timeSlot: TimeSlot = {
        dayStart: get24HourTimeString(practice.dayStart),
        dayEnd: get24HourTimeString(practice.dayEnd),
        id: practice.id,
      };

      const key = practice.weekday.toString();

      if (!weekdayToSlotsObj[key] && !weekdayToSlotsObj[key]?.length) {
        weekdayToSlotsObj[key] = [];
      }

      weekdayToSlotsObj[key].push(timeSlot);
    });

    // sorting slots by start time
    for (let weekday = 0; weekday < 7; weekday++) {
      if (weekdayToSlotsObj[weekday.toString()]?.length) {
        weekdayToSlotsObj[weekday.toString()].sort((a, b) => timeToNumber(a.dayStart) - timeToNumber(b.dayStart));
      }
    }

    let slotNo = 0;

    while (true) {
      const allWeekTimeSlots: { [key: string]: TimeSlot } = {};

      let done = true;

      for (let weekday = 0; weekday < 7; weekday++) {
        const key = weekday.toString();

        if (weekdayToSlotsObj[key]?.length > slotNo) {
          allWeekTimeSlots[key] = { ...allWeekTimeSlots, ...weekdayToSlotsObj[key][slotNo] };
          if (done) {
            done = false;
          }
        }
      }

      if (done) {
        break;
      }

      slotNo++;

      practiceAvailability.push({
        slotNo,
        monday: { ...allWeekTimeSlots['1'] },
        tuesday: { ...allWeekTimeSlots['2'] },
        wednesday: { ...allWeekTimeSlots['3'] },
        thursday: { ...allWeekTimeSlots['4'] },
        friday: { ...allWeekTimeSlots['5'] },
        saturday: { ...allWeekTimeSlots['6'] },
        sunday: { ...allWeekTimeSlots['0'] },
      });
    }

    return practiceAvailability;
  }

  public deleteExam(id: number) {
    const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Exam?',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    dialogRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => this.examApiService.deleteExam(id)),
        take(1),
      )
      .subscribe(() => {
        this.notificationSvc.showNotification('Exam deleted successfully');
        this.router.navigate(['/', 'exam']);
      });
  }
}
