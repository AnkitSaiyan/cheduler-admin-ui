import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, filter, map, switchMap, take, takeUntil } from 'rxjs';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { TimeSlot, WeekWisePracticeAvailability, Weekday } from '../../../../shared/models/calendar.model';
import { Exam, Uncombinables } from '../../../../shared/models/exam.model';
import { PracticeAvailability } from '../../../../shared/models/practice.model';
import { ENG_BE, EXAM_ID } from '../../../../shared/utils/const';

import { DfmDatasource, DfmTableHeader } from 'diflexmo-angular-design';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { Translate } from '../../../../shared/models/translate.model';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { UserUtils } from 'src/app/shared/utils/user.utils';

@Component({
	selector: 'dfm-view-exam',
	templateUrl: './view-exam.component.html',
	styleUrls: ['./view-exam.component.scss'],
})
export class ViewExamComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public examDetails$$ = new BehaviorSubject<Exam | undefined>(undefined);

	public uncombinablesExam$$ = new BehaviorSubject<Uncombinables[]>([]);

	public practiceAvailability$$ = new BehaviorSubject<any[]>([]);

	public columns: Weekday[] = [Weekday.MON, Weekday.TUE, Weekday.WED, Weekday.THU, Weekday.FRI, Weekday.SAT, Weekday.SUN];

	private selectedLang: string = ENG_BE;

	public readonly Permission = Permission;

	private batchColumns: string[] = ['BatchName', 'Room', 'Expensive', 'Assistant', 'Radiologist', 'Nursing', 'Secretary', 'Mandatory'];

	public tableHeaders: DfmTableHeader[] = [
		{ id: '1', title: 'Batch Name', isSortable: false },
		{ id: '2', title: 'Rooms', isSortable: false },
		{ id: '3', title: 'Expensive', isSortable: false },
		{ id: '4', title: 'Assistants', isSortable: false },
		{ id: '5', title: 'Radiologist', isSortable: false },
		{ id: '6', title: 'Nursing', isSortable: false },
		{ id: '7', title: 'Secretary', isSortable: false },
		{ id: '8', title: 'Mandatory', isSortable: false },
	];

	public tableData$$ = new BehaviorSubject<DfmDatasource<any>>({
		items: [],
		isInitialLoading: true,
		isLoadingMore: false,
	});

	constructor(
		private examApiService: ExamApiService,
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
					this.tableData$$.next({
						items:
							exam?.resourcesBatch.map((item) => {
								const { assistants, radiologists, nursing, secretaries, mandatory } = UserUtils.GroupUsersByType(item.users);
								return { ...item, id: item.batchId, assistants, radiologists, nursing, secretaries, mandatory };
							}) ?? [],
						isInitialLoading: false,
						isLoading: false,
						isLoadingMore: false,
					});

					console.log(this.tableData$$.value);
					if (exam?.practiceAvailability?.length) {
						this.practiceAvailability$$.next([...this.getPracticeAvailability(exam.practiceAvailability)]);
					}
				},
			});

		this.shareDataService
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => {
					this.selectedLang = lang;
					this.tableHeaders = this.tableHeaders.map((h, i) => ({
						...h,
						title: Translate[this.batchColumns[i]][lang],
					}));
				},
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
