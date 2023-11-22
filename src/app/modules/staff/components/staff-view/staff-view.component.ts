import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, filter, first, map, switchMap, take, takeUntil } from 'rxjs';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { WeekdayTimeSlot } from 'src/app/shared/models/time-slot.model';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { TimeSlot, WeekWisePracticeAvailability } from '../../../../shared/models/calendar.model';
import { PracticeAvailability } from '../../../../shared/models/practice.model';
import { Translate } from '../../../../shared/models/translate.model';
import { User } from '../../../../shared/models/user.model';
import { ENG_BE, STAFF_ID } from '../../../../shared/utils/const';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';

@Component({
	selector: 'dfm-staff-view',
	templateUrl: './staff-view.component.html',
	styleUrls: ['./staff-view.component.scss'],
})
export class StaffViewComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public staffDetails$$ = new BehaviorSubject<User | undefined>(undefined);

	public examIdToNameMap = new Map<number, string>();

	public practiceAvailability$$ = new BehaviorSubject<Array<WeekWisePracticeAvailability[]>>([]);

	private selectedLang: string = ENG_BE;

	public readonly Permission = Permission;

	constructor(
		private userApiService: UserApiService,
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
				first(),
				switchMap((staffID) => this.userApiService.getUserByID$(+staffID)),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (staffDetails) => {
					this.staffDetails$$.next(staffDetails);

					if (staffDetails?.practiceAvailability?.length) {
						this.practiceAvailability$$.next([...this.getPracticeAvailability(staffDetails.practiceAvailability)]);
					}
				},
			});

		this.examApiSvc.allExams$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (exams) => exams.forEach((exam) => this.examIdToNameMap.set(+exam.id, exam.name)),
		});

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
				this.router.navigate(['/', 'staff'], { queryParamsHandling: 'merge' });
			});
	}

	private getPracticeAvailability(practiceAvailabilities: PracticeAvailability[]): Array<WeekWisePracticeAvailability[]> {
		// const weekdayToSlotsObj: { [key: string]: TimeSlot[] } = {};
		const weekdayTimeSlots: WeekdayTimeSlot<TimeSlot[]>[] = [];

		// creating week-wise slots
		practiceAvailabilities.forEach((practice) => {
			const weekdayString: string = `${practice.weekday}`;
			const { rangeIndex } = practice;

			if (!weekdayTimeSlots[rangeIndex]) {
				weekdayTimeSlots[rangeIndex] = {};
			}

			if (!weekdayTimeSlots[rangeIndex][weekdayString]?.length) {
				weekdayTimeSlots[rangeIndex][weekdayString] = [];
			}

			const timeSlot: TimeSlot = {
				dayStart: DateTimeUtils.TimeStringIn24Hour(practice.dayStart),
				dayEnd: DateTimeUtils.TimeStringIn24Hour(practice.dayEnd),
				id: practice.id,
			};
			weekdayTimeSlots[rangeIndex][weekdayString].push(timeSlot);
		});

		const practiceAvailability: Array<WeekWisePracticeAvailability[]> = [];

		weekdayTimeSlots.forEach((weekdayTimeSlotObject: WeekdayTimeSlot<TimeSlot[]>, index: number) => {
			// sorting slots by start time
			for (let weekday = 0; weekday < 7; weekday++) {
				const weekdayString: string = `${weekday}`;
				if (weekdayTimeSlotObject[weekdayString]?.length) {
					weekdayTimeSlotObject[weekdayString].sort((a, b) => DateTimeUtils.TimeToNumber(a.dayStart) - DateTimeUtils.TimeToNumber(b.dayStart));
				}
			}

			// creating weekday-wise slot data
			let slotNo = 0;

			while (true) {
				const allWeekTimeSlots: WeekdayTimeSlot<TimeSlot> = {};

				let done = true;

				for (let weekday = 0; weekday < 7; weekday++) {
					const weekdayString: string = `${weekday}`;
					if (weekdayTimeSlotObject[weekdayString]?.length > slotNo) {
						allWeekTimeSlots[weekdayString] = { ...(allWeekTimeSlots[weekdayString] ?? {}), ...weekdayTimeSlotObject[weekdayString][slotNo] };
						if (done) {
							done = false;
						}
					}
				}

				if (done) {
					break;
				}

				slotNo++;

				if (!practiceAvailability[index]?.length) {
					practiceAvailability[index] = [];
				}

				const { rangeFromDate, rangeToDate, isRange } = practiceAvailabilities?.find((practice) => practice.rangeIndex === index)!;

				practiceAvailability[index].push({
					slotNo,
					rangeFromDate: rangeFromDate ? DateTimeUtils.UTCDateToLocalDate(new Date(rangeFromDate), true) : null,
					rangeToDate: rangeToDate ? DateTimeUtils.UTCDateToLocalDate(new Date(rangeToDate), true) : null,
					isRange,
					monday: { ...(allWeekTimeSlots['1'] ?? {}) },
					tuesday: { ...(allWeekTimeSlots['2'] ?? {}) },
					wednesday: { ...(allWeekTimeSlots['3'] ?? {}) },
					thursday: { ...(allWeekTimeSlots['4'] ?? {}) },
					friday: { ...(allWeekTimeSlots['5'] ?? {}) },
					saturday: { ...(allWeekTimeSlots['6'] ?? {}) },
					sunday: { ...(allWeekTimeSlots['0'] ?? {}) },
				});
			}
		});
		return practiceAvailability;
	}
}
