import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, map, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../../../shared/models/user.model';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { ENG_BE, STAFF_ID } from '../../../../shared/utils/const';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Weekday } from '../../../../shared/models/calendar.model';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { PracticeAvailability } from '../../../../shared/models/practice.model';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { ModalService } from '../../../../core/services/modal.service';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { UserApiService } from '../../../../core/services/user-api.service';
import { Permission } from 'src/app/shared/models/permission.model';

interface TimeSlot {
	id?: number;
	dayStart: string;
	dayEnd: string;
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

	private selectedLang: string = ENG_BE;

	public readonly Permission = Permission;

	constructor(
		private userApiService: UserApiService,
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
				filter((params) => params[STAFF_ID]),
				map((params) => params[STAFF_ID]),
				switchMap((staffID) => this.userApiService.getUserByID$(+staffID)),
				takeUntil(this.destroy$$),
			)
			.subscribe((staffDetails) => {
				this.staffDetails$$.next(staffDetails);

				if (staffDetails?.practiceAvailability?.length) {
					this.practiceAvailability$$.next([...this.getPracticeAvailability(staffDetails.practiceAvailability)]);
				}
			});

		this.examApiSvc.allExams$
			.pipe(takeUntil(this.destroy$$))
			.subscribe((exams) => exams.forEach((exam) => this.examIdToNameMap.set(+exam.id, exam.name)));

		this.shareDataService
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => (this.selectedLang = lang));
	}

	public override ngOnDestroy(): void {
		super.ngOnDestroy();
	}

	public deleteStaff(id: number) {
		const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreyousureyouwanttodeletethisStaff?',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		dialogRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.userApiService.deleteUser(id)),
				take(1),
			)
			.subscribe(() => {
				this.notificationSvc.showNotification(Translate.SuccessMessage.StaffDeleted[this.selectedLang]);
				this.router.navigate(['/', 'staff']);
			});
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
}
