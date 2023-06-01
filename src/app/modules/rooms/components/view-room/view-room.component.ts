import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TimeSlot, Weekday, WeekWisePracticeAvailability } from '../../../../shared/models/calendar.model';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ROOM_ID } from '../../../../shared/utils/const';
import { PracticeAvailability } from '../../../../shared/models/practice.model';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { Room } from '../../../../shared/models/rooms.model';
import { AddRoomModalComponent } from '../add-room-modal/add-room-modal.component';
import { ENG_BE } from '../../../../shared/utils/const';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { Permission } from 'src/app/shared/models/permission.model';

@Component({
	selector: 'dfm-view-room',
	templateUrl: './view-room.component.html',
	styleUrls: ['./view-room.component.scss'],
})
export class ViewRoomComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public roomDetails$$ = new BehaviorSubject<Room | undefined>(undefined);

	public rooms$$ = new BehaviorSubject<Room[]>([]);

	public examIdToNameMap = new Map<number, string>();

	public roomPlaceInToIndexMap = new Map<number, number>();

	public practiceAvailability$$ = new BehaviorSubject<any[]>([]);

	private selectedLang: string = ENG_BE;

	public readonly Permission = Permission;

	public columns: Weekday[] = [Weekday.MON, Weekday.TUE, Weekday.WED, Weekday.THU, Weekday.FRI, Weekday.SAT, Weekday.SUN];

	constructor(
		private roomApiSvc: RoomsApiService,
		private routerStateSvc: RouterStateService,
		private examApiSvc: ExamApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private modalSvc: ModalService,
		private shareDataService: ShareDataService,
		private route: ActivatedRoute,
	) {
		super();
	}

	public ngOnInit(): void {
		this.route.params
			.pipe(
				filter((params) => params[ROOM_ID]),
				map((params) => params[ROOM_ID]),
				switchMap((roomID) => this.roomApiSvc.getRoomByID(+roomID)),
				takeUntil(this.destroy$$),
			)
			.subscribe((roomDetails) => {
				this.roomDetails$$.next(roomDetails);

				if (roomDetails?.practiceAvailability?.length) {
					this.practiceAvailability$$.next([...this.getPracticeAvailability(roomDetails.practiceAvailability)]);
				}
			});

		this.roomApiSvc.allRooms$.pipe(take(1)).subscribe((rooms) => {
			this.rooms$$.next(rooms);
			this.roomPlaceInToIndexMap.clear();
			rooms.forEach((room, index) => {
				this.roomPlaceInToIndexMap.set(+room.placeInAgenda, index + 1);
			});
		});

		this.examApiSvc.allExams$
			.pipe(takeUntil(this.destroy$$))
			.subscribe((exams) => exams.forEach((exam) => this.examIdToNameMap.set(+exam.id, exam.name)));

		this.shareDataService
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => (this.selectedLang = lang));
	}

	private getPracticeAvailability(practiceAvailabilities: PracticeAvailability[]): WeekWisePracticeAvailability[] {
		const weekdayToSlotsObj: { [key: string]: TimeSlot[] } = {};

		const practiceAvailability: WeekWisePracticeAvailability[] = [];

		// creating week-wise slots
		practiceAvailabilities.forEach((practice) => {
			const timeSlot: TimeSlot = {
				dayStart: DateTimeUtils.TimeStringIn24Hour(practice.dayStart),
				dayEnd: DateTimeUtils.TimeStringIn24Hour(practice.dayEnd),
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
				weekdayToSlotsObj[weekday.toString()].sort((a, b) => DateTimeUtils.TimeToNumber(a.dayStart) - DateTimeUtils.TimeToNumber(b.dayStart));
			}
		}

		let slotNo = 0;

		while (true) {
			const allWeekTimeSlots: { [key: string]: TimeSlot } = {};

			let done = true;

			for (let weekday = 0; weekday < 7; weekday++) {
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
				sunday: { ...allWeekTimeSlots['0'] },
			});
		}

		return practiceAvailability;
	}

	public deleteRoom(id: number) {
		const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreYouSureYouWantThisRoom',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		dialogRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.roomApiSvc.deleteRoom(id)),
				take(1),
			)
			.subscribe(() => {
				this.notificationSvc.showNotification(Translate.SuccessMessage.RoomsDeleted[this.selectedLang]);
				this.router.navigate(['/', 'room']);
			});
	}

	public openEditRoomModal(roomDetails: Room) {
		this.modalSvc.open(AddRoomModalComponent, {
			data: {
				edit: !!roomDetails?.id,
				roomID: roomDetails?.id,
				placeInAgendaIndex: roomDetails ? this.roomPlaceInToIndexMap.get(+roomDetails.placeInAgenda) : this.rooms$$.value.length + 1,
			},
			options: {
				size: 'lg',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
			},
		});
	}
}
