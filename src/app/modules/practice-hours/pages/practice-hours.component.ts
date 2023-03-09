import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {BehaviorSubject, debounceTime, Subject, takeUntil} from 'rxjs';
import {BadgeColor, InputDropdownComponent, NotificationType} from 'diflexmo-angular-design';
import {DestroyableComponent} from '../../../shared/components/destroyable.component';
import {TimeSlot, Weekday} from '../../../shared/models/calendar.model';
import {NotificationDataService} from '../../../core/services/notification-data.service';
import {PracticeAvailabilityServer} from '../../../shared/models/practice.model';
import {PracticeHoursApiService} from '../../../core/services/practice-hours-api.service';
import {checkTimeRangeOverlapping, formatTime, get24HourTimeString, timeToNumber} from '../../../shared/utils/time';
import {NameValue} from '../../../shared/components/search-modal.component';
import {NameValuePairPipe} from '../../../shared/pipes/name-value-pair.pipe';
import {TimeInIntervalPipe} from '../../../shared/pipes/time-in-interval.pipe';
import {getNumberArray} from '../../../shared/utils/getNumberArray';
import {toggleControlError} from '../../../shared/utils/toggleControlError';
import {TIME_24} from '../../../shared/utils/const';
import {Translate} from '../../../shared/models/translate.model';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {COMING_FROM_ROUTE, EDIT, EXAM_ID, ENG_BE, DUTCH_BE, Statuses, StatusesNL} from '../../../shared/utils/const';
import {GeneralUtils} from '../../../shared/utils/general.utils';
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

  private selectedLang: string = ENG_BE;

  constructor(
    private fb: FormBuilder,
    private notificationSvc: NotificationDataService,
    private practiceHourApiSvc: PracticeHoursApiService,
    private cdr: ChangeDetectorRef,
    private shareDataSvc: ShareDataService,
  ) {
    super();
  }

  public ngOnInit(): void {
    this.practiceHourApiSvc.practiceHours$.pipe(takeUntil(this.destroy$$)).subscribe((practiceHours) => {
      this.practiceHoursData$$.next(practiceHours);
    });

    this.shareDataSvc
      .getLanguage$()
      .pipe(takeUntil(this.destroy$$))
      .subscribe((lang) => (this.selectedLang = lang));
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  prv
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


    console.log(values);
    this.practiceHourApiSvc
      .savePracticeHours$(values)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(
        () => {
          if (this.practiceHoursData$$.value?.length) {
            this.notificationSvc.showNotification(Translate.SuccessMessage.Updated[this.selectedLang]);
          } else {
            this.notificationSvc.showNotification(Translate.SuccessMessage.Added[this.selectedLang]);
          }
          this.submitting$$.next(false);
        },
        () => this.submitting$$.next(false),
      );
  }
}
