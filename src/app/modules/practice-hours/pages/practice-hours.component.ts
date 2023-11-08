import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NotificationType } from 'diflexmo-angular-design';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { TimeSlotUtils } from 'src/app/shared/utils/time-slots.utils';
import { NotificationDataService } from '../../../core/services/notification-data.service';
import { PracticeHoursApiService } from '../../../core/services/practice-hours-api.service';
import { DestroyableComponent } from '../../../shared/components/destroyable.component';
import { NameValue } from '../../../shared/components/search-modal.component';
import { Weekday } from '../../../shared/models/calendar.model';
import { PracticeAvailabilityServer } from '../../../shared/models/practice.model';
import { Translate } from '../../../shared/models/translate.model';

interface PracticeHourFormValues {
	selectedWeekday: Weekday;
	practiceHours: {
		[key: string]: {
			id?: number;
			weekday: Weekday;
			dayStart: string;
			dayEnd: string;
			startTimings: NameValue[];
			endTimings: NameValue[];
		}[];
	};
}

interface ExceptionFormValues {
	exception: {
		date: {
			day: number;
			month: number;
			year: number;
		};
		startTime: {
			hour: number;
			minute: number;
		};
		endTime: {
			hour: number;
			minute: number;
		};
	}[];
}

@Component({
	selector: 'dfm-practice-hours',
	templateUrl: './practice-hours.component.html',
	styleUrls: ['./practice-hours.component.scss'],
})
export class PracticeHoursComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public practiceHoursData$$ = new BehaviorSubject<PracticeAvailabilityServer[]>([]);

	public submitting$$ = new BehaviorSubject<boolean>(false);

	private selectedLang!: string;

	public practiceForm!: FormGroup;

	constructor(
		private notificationSvc: NotificationDataService,
		private practiceHourApiSvc: PracticeHoursApiService,
		private shareDataSvc: ShareDataService,
	) {
		super();

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => (this.selectedLang = lang));
	}

	public ngOnInit(): void {
		this.practiceForm = new FormGroup({});
		this.practiceHourApiSvc.practiceHoursWithTimeConversion$.pipe(takeUntil(this.destroy$$)).subscribe((practiceHours) => {
			this.practiceHoursData$$.next(practiceHours);
		});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public saveForm() {
		if (this.practiceForm.invalid) {
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			return;
		}

		const formValues = TimeSlotUtils.getFormRequestBody(this.practiceForm?.get('timeSlotForm')?.value);

		this.submitting$$.next(true);

		this.practiceHourApiSvc
			.savePracticeHours$(formValues)
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: () => {
					if (this.practiceHoursData$$.value?.length) {
						this.notificationSvc.showNotification(Translate.SuccessMessage.PracticeHoursUpdated[this.selectedLang]);
					} else {
						this.notificationSvc.showNotification(Translate.SuccessMessage.PracticeHoursAdded[this.selectedLang]);
					}
					this.submitting$$.next(false);
				},
				error: () => this.submitting$$.next(false),
			});
	}
}
