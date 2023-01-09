import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { User } from '../../../../shared/models/user.model';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { STAFF_ID } from '../../../../shared/utils/const';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Weekday } from '../../../../shared/models/weekday';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { PracticeAvailability } from '../../../../shared/models/practice.model';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { ModalService } from '../../../../core/services/modal.service';

interface TimeSlot {
  id?: number;
  dayStart: Date;
  dayEnd: Date;
}

interface WeekWisePracticeAvailability {
  slotNo: number;
  monday: TimeSlot;
  tuesday: TimeSlot;
  wednesday: TimeSlot;
  thursday: TimeSlot;
  friday: TimeSlot;
  saturday: TimeSlot;
  sunday: TimeSlot;
}

@Component({
  selector: 'dfm-staff-view',
  templateUrl: './staff-view.component.html',
  styleUrls: ['./staff-view.component.scss'],
})
export class StaffViewComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public staffDetails$$ = new BehaviorSubject<User | undefined>(undefined);

  public examIdToNameMap = new Map<number, string>();

  public practiceAvailability$$ = new BehaviorSubject<any[]>([]);

  public columns: Weekday[] = [Weekday.MON, Weekday.TUE, Weekday.WED, Weekday.THU, Weekday.FRI, Weekday.SAT, Weekday.SUN];

  constructor(
    private staffApiSvc: StaffApiService,
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
      .listenForParamChange$(STAFF_ID)
      .pipe(
        switchMap((staffID) => this.staffApiSvc.getStaffByID(+staffID)),
        takeUntil(this.destroy$$),
      )
      .subscribe((staffDetails) => {
        this.staffDetails$$.next(staffDetails);

        if (staffDetails?.practiceAvailability?.length) {
          this.practiceAvailability$$.next([...this.getPracticeAvailability(staffDetails.practiceAvailability)]);
        }
      });

    this.examApiSvc.exams$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((exams) => exams.forEach((exam) => this.examIdToNameMap.set(+exam.id, exam.name)));
  }

  private getPracticeAvailability(practiceAvailabilities: PracticeAvailability[]): WeekWisePracticeAvailability[] {
    const weekdayToSlotsObj: { [key: string]: TimeSlot[] } = {};

    const practiceAvailability: WeekWisePracticeAvailability[] = [];

    // creating week-wise slots
    practiceAvailabilities.forEach((practice) => {
      const timeSlot: TimeSlot = {
        dayStart: practice.dayStart,
        dayEnd: practice.dayEnd,
        id: practice.id,
      };

      if (!weekdayToSlotsObj[practice.weekday.toString()] && !weekdayToSlotsObj[practice.weekday.toString()]?.length) {
        weekdayToSlotsObj[practice.weekday.toString()] = [];
      }

      weekdayToSlotsObj[practice.weekday.toString()].push(timeSlot);
    });

    // sorting slots by start time
    for (let weekday = 1; weekday <= 7; weekday++) {
      if (weekdayToSlotsObj[weekday.toString()]?.length) {
        weekdayToSlotsObj[weekday.toString()].sort((a, b) => new Date(a.dayStart).getTime() - new Date(b.dayStart).getTime());
      }
    }

    let slotNo = 0;

    while (true) {
      const allWeekTimeSlots: { [key: string]: TimeSlot } = {};

      let done = true;

      for (let weekday = 1; weekday <= 7; weekday++) {
        if (weekdayToSlotsObj[weekday.toString()]?.length > slotNo) {
          allWeekTimeSlots[weekday.toString()] = { ...allWeekTimeSlots, ...weekdayToSlotsObj[weekday.toString()][slotNo] };
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
        sunday: { ...allWeekTimeSlots['7'] },
      });
    }

    return practiceAvailability;
  }

  // public deleteStaff(id: number) {
  //   this.staffApiSvc.deleteStaff(id);
  //   this.notificationSvc.showNotification('Staff deleted successfully');
  //   this.router.navigate(['/', 'staff']);
  // }

  public deleteStaff(id: number) {
    const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Staff?',
        confirmButtonText: 'Proceed',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    dialogRef.closed
      .pipe(
        filter((res: boolean) => res),
        take(1),
      )
      .subscribe(() => {
        this.staffApiSvc.deleteStaff(id);
        this.notificationSvc.showNotification('Staff deleted successfully');
        this.router.navigate(['/', 'staff']);
      });
  }
}
