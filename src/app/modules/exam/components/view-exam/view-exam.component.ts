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
import { Exam } from '../../../../shared/models/exam.model';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';

@Component({
  selector: 'dfm-view-exam',
  templateUrl: './view-exam.component.html',
  styleUrls: ['./view-exam.component.scss'],
})
export class ViewExamComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public examDetails$$ = new BehaviorSubject<Exam | undefined>(undefined);

  public roomIdToNameMap = new Map<number, string>();

  public staffsGroupedByTypes: {
    mandatory: string[];
    radiologists: string[];
    assistants: string[];
    nursing: string[];
    secretaries: string[];
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
      .subscribe((examDetails) => {
        this.examDetails$$.next(examDetails);

        if (examDetails?.practiceAvailability?.length) {
          this.practiceAvailability$$.next([...this.getPracticeAvailability(examDetails.practiceAvailability)]);
        }
      });

    this.roomApiService.rooms$
      .pipe(takeUntil(this.destroy$$))
      .subscribe((rooms) => rooms.forEach((room) => this.roomIdToNameMap.set(+room.id, room.name)));

    this.staffApiSvc.staffList$.pipe(takeUntil(this.destroy$$)).subscribe((staffs) => {
      const staffIdToDetailsMap = new Map<number, User>();
      staffs.forEach((staff) => staffIdToDetailsMap.set(staff.id, staff));

      this.examDetails$$.value?.usersList?.forEach((userID) => {
        const staff = staffIdToDetailsMap.get(userID);

        if (staff) {
          const name = `${staff.firstname} ${staff.lastname}`;
          switch (staff.userType) {
            case UserType.Assistant:
              this.staffsGroupedByTypes.assistants.push(name);
              break;
            case UserType.Radiologist:
              this.staffsGroupedByTypes.radiologists.push(name);
              break;
            case UserType.Nursing:
              this.staffsGroupedByTypes.nursing.push(name);
              break;
            case UserType.Secretary:
            case UserType.Scheduler:
              this.staffsGroupedByTypes.secretaries.push(name);
              break;
            default:
              this.staffsGroupedByTypes.mandatory.push(name);
          }
        }
      });
    });
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
        switchMap(()=>this.examApiService.deleteExam(id)),
        take(1),
      )
      .subscribe(() => {
        this.notificationSvc.showNotification('Exam deleted successfully');
        this.router.navigate(['/', 'exam']);
      });
  }
}
