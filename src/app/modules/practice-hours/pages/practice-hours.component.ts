import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {BehaviorSubject, Subject, take, takeUntil} from 'rxjs';
import {BadgeColor, InputDropdownComponent, NotificationType} from 'diflexmo-angular-design';
import {DestroyableComponent} from '../../../shared/components/destroyable.component';
import {TimeSlot, Weekday} from '../../../shared/models/calendar.model';
import {NotificationDataService} from '../../../core/services/notification-data.service';
import {PracticeAvailabilityServer} from '../../../shared/models/practice.model';
import {PracticeHoursApiService} from '../../../core/services/practice-hours-api.service';
import {NameValue} from '../../../shared/components/search-modal.component';
import {Translate} from '../../../shared/models/translate.model';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {ENG_BE} from '../../../shared/utils/const';

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

	public emitEvents$$ = new Subject<void>();

	private selectedLang!: string;

	public practiceForm!: FormGroup;

	constructor(
		private fb: FormBuilder,
		private notificationSvc: NotificationDataService,
		private practiceHourApiSvc: PracticeHoursApiService,
		private cdr: ChangeDetectorRef,
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

	public savePracticeHours(): void {
		this.emitEvents$$.next();
	}

	public saveForm(formValues: { isValid: boolean; values: TimeSlot[] }) {
		if (!formValues.isValid) {
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			return;
		}

		this.submitting$$.next(true);

		const { values } = formValues;

		this.practiceHourApiSvc
			.savePracticeHours$(values)
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
