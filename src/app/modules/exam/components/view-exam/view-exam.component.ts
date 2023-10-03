import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, filter, map, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { User, UserType } from '../../../../shared/models/user.model';
import { TimeSlot, Weekday, WeekWisePracticeAvailability } from '../../../../shared/models/calendar.model';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ENG_BE, EXAM_ID } from '../../../../shared/utils/const';
import { PracticeAvailability } from '../../../../shared/models/practice.model';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { Exam, Uncombinables } from '../../../../shared/models/exam.model';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { NameValue } from '../../../../shared/components/search-modal.component';

import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { Permission } from 'src/app/shared/models/permission.model';

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

	private selectedLang: string = ENG_BE;

	public readonly Permission = Permission;

	constructor(
		private examApiService: ExamApiService,
		private roomApiService: RoomsApiService,
		private routerStateSvc: RouterStateService,
		private examApiSvc: ExamApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private modalSvc: ModalService,
		public shareDataService: ShareDataService,
		private route: ActivatedRoute,
	) {
		super();
	}

	public ngOnInit(): void {
		this.route.params
			.pipe(
				filter((params) => params[EXAM_ID]),
				map((params) => params[EXAM_ID]),
				switchMap((examID) => this.examApiService.getExamByID(+examID)),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (exam) => {
					this.examDetails$$.next(exam);
					this.uncombinablesExam$$.next(exam?.uncombinablesExam ?? []);
					if (exam?.practiceAvailability?.length) {
						this.practiceAvailability$$.next([...this.getPracticeAvailability(exam.practiceAvailability)]);
					}

					if (exam?.users?.length) {
						this.saveStaffDetails(exam.users);
					}
				},
			});

		this.shareDataService
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => (this.selectedLang = lang),
			});
	}

	public deleteExam(id: number) {
		const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreYouSureYouWantToDeleteThisExam',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		dialogRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.examApiService.deleteExam(id)),
				take(1),
			)
			.subscribe({
				next: () => {
					this.notificationSvc.showNotification(Translate.SuccessMessage.ExamDeleted[this.selectedLang]);
					this.router.navigate(['/', 'exam'], { queryParamsHandling: 'merge', relativeTo: this.route });
				},
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
				dayStart: DateTimeUtils.TimeStringIn24Hour(practice.dayStart),
				dayEnd: DateTimeUtils.TimeStringIn24Hour(practice.dayEnd),
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
				weekdayToSlotsObj[weekday.toString()].sort((a, b) => DateTimeUtils.TimeToNumber(a.dayStart) - DateTimeUtils.TimeToNumber(b.dayStart));
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
}
