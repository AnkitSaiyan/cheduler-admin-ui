import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { TimeSlot, Weekday, WeekWisePracticeAvailability } from '../../../../shared/models/calendar.model';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ROOM_ID } from '../../../../shared/utils/const';
import { PracticeAvailability } from '../../../../shared/models/practice.model';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { Room } from '../../../../shared/models/rooms.model';
import { AddRoomModalComponent } from '../add-room-modal/add-room-modal.component';

@Component({
  selector: 'dfm-view-room',
  templateUrl: './view-room.component.html',
  styleUrls: ['./view-room.component.scss'],
})
export class ViewRoomComponent extends DestroyableComponent implements OnInit, OnDestroy {
  public roomDetails$$ = new BehaviorSubject<Room | undefined>(undefined);

  public examIdToNameMap = new Map<number, string>();

  public practiceAvailability$$ = new BehaviorSubject<any[]>([]);

  public columns: Weekday[] = [Weekday.MON, Weekday.TUE, Weekday.WED, Weekday.THU, Weekday.FRI, Weekday.SAT, Weekday.SUN];

  constructor(
    private roomApiSvc: RoomsApiService,
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
      .listenForParamChange$(ROOM_ID)
      .pipe(
        switchMap((roomID) => this.roomApiSvc.getRoomByID(+roomID)),
        takeUntil(this.destroy$$),
      )
      .subscribe((roomDetails) => {
        this.roomDetails$$.next(roomDetails);

        if (roomDetails?.practiceAvailability?.length) {
          this.practiceAvailability$$.next([...this.getPracticeAvailability(roomDetails.practiceAvailability)]);
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
        dayStart: this.getTimeIn24Hour(practice.dayStart),
        dayEnd: this.getTimeIn24Hour(practice.dayEnd),
        id: practice.id,
      };

      if (!weekdayToSlotsObj[practice.weekday.toString()] && !weekdayToSlotsObj[practice.weekday.toString()]?.length) {
        weekdayToSlotsObj[practice.weekday.toString()] = [];
      }

      weekdayToSlotsObj[practice.weekday.toString()].push(timeSlot);
    });

    // sorting slots by start time
    for (let weekday = 0; weekday < 7; weekday++) {
      if (weekdayToSlotsObj[weekday.toString()]?.length) {
        weekdayToSlotsObj[weekday.toString()].sort((a, b) => this.timeStringToNo(a.dayStart) - this.timeStringToNo(b.dayStart));
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

  private getTimeIn24Hour(timeString: string): string {
    let start = '';

    if (timeString) {
      if (timeString.toLowerCase().includes('pm')) {
        const s = +timeString.slice(0, 2);
        if (s < 12) {
          start = `${s + 12}:${timeString.slice(3, 5)}`;
        }
      } else {
        start = timeString.slice(0, 5);
      }
    }

    return start;
  }

  private timeStringToNo(timeString: string): number {
    if (timeString && timeString.includes(':')) {
      return +timeString.split(':').join('');
    }

    return 0;
  }

  public deleteRoom(id: number) {
    const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Room?',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    dialogRef.closed
      .pipe(
        filter((res: boolean) => res),
        switchMap(() => this.roomApiSvc.deleteRoom(id)),
        take(1),
      )
      .subscribe(() => {
        this.notificationSvc.showNotification('Room deleted successfully');
        this.router.navigate(['/', 'room']);
      });
  }

  public openEditRoomModal() {
    this.modalSvc.open(AddRoomModalComponent, {
      data: { edit: !!this.roomDetails$$.value?.id, roomID: this.roomDetails$$.value?.id },
      options: {
        size: 'lg',
        centered: true,
        backdropClass: 'modal-backdrop-remove-mv',
      },
    });
  }
}
