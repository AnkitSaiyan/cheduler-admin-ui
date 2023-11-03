import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationType } from 'diflexmo-angular-design';
import { BehaviorSubject, Subject, debounceTime, map, of, switchMap, take, takeUntil, tap } from 'rxjs';
import { PracticeHoursApiService } from 'src/app/core/services/practice-hours-api.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { TimeSlotFormValues, TimeSlotStaff } from 'src/app/shared/models/time-slot.model';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { PracticeAvailabilityServer } from '../../../../shared/models/practice.model';
import { AddStaffRequestData } from '../../../../shared/models/staff.model';
import { Status } from '../../../../shared/models/status.model';
import { Translate } from '../../../../shared/models/translate.model';
import { AvailabilityType, User, UserType } from '../../../../shared/models/user.model';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { COMING_FROM_ROUTE, DUTCH_BE, EDIT, EMAIL_REGEX, ENG_BE, STAFF_ID, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';

interface FormValues {
	firstname: string;
	lastname: string;
	email: string;
	telephone: string;
	address: string;
	userType: UserType;
	practiceAvailabilityToggle?: boolean;
	examList: number[];
	info: string;
	practiceAvailabilityArray: PracticeAvailability[];
}

interface PracticeAvailability {
	isRange: boolean;
	rangeFromDate?: Date | null;
	rangeToDate?: Date | null;
	practiceAvailability: TimeSlotFormValues;
}

@Component({
	selector: 'dfm-add-staff',
	templateUrl: './add-staff.component.html',
	styleUrls: ['./add-staff.component.scss'],
})
export class AddStaffComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public addStaffForm!: FormGroup;

	public exams$$ = new BehaviorSubject<NameValue[] | null>(null);

	public staffTypes$$ = new BehaviorSubject<NameValue[]>([]);

	public staffDetails$$ = new BehaviorSubject<User | undefined>(undefined);

	public loading$$ = new BehaviorSubject<boolean>(false);

	public submitting$$ = new BehaviorSubject<boolean>(false);

	public staffAvailabilityData$$ = new BehaviorSubject<PracticeAvailabilityServer[]>([]);

	public practiceHourData$$ = new BehaviorSubject<PracticeAvailabilityServer[]>([]);

	public emitEvents$$ = new Subject<void>();

	public comingFromRoute = '';

	public staffID!: number;

	public edit = false;

	public timings: NameValue[] = [];

	public filteredTimings: NameValue[] = [];

	public readonly interval: number = 5;

	public statuses = Statuses;

	private selectedLang: string = ENG_BE;

	public selectedIndex = 0;

	public CONTROL_KEY = 'practiceAvailability';

	public today = new Date();

	constructor(
		private fb: FormBuilder,
		private userApiSvc: UserApiService,
		private examApiSvc: ExamApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private route: ActivatedRoute,
		private nameValuePipe: NameValuePairPipe,
		private timeInIntervalPipe: TimeInIntervalPipe,
		private shareDataSvc: ShareDataService,
		private practiceHourApiSvc: PracticeHoursApiService,
	) {
		super();

		const state = this.router.getCurrentNavigation()?.extras?.state;
		if (state !== undefined) {
			this.loading$$.next(true);
			this.comingFromRoute = state[COMING_FROM_ROUTE];
			this.edit = state[EDIT];

			localStorage.setItem(COMING_FROM_ROUTE, this.comingFromRoute);
			if (typeof this.edit === 'boolean') {
				localStorage.setItem(EDIT, this.edit.toString());
			}
		} else {
			this.loading$$.next(true);
			this.getComingFromRouteFromLocalStorage();
		}
	}

	public get formValues(): FormValues {
		return this.addStaffForm.value;
	}

	public ngOnInit(): void {
		this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(this.interval))];
		this.filteredTimings = [...this.timings];

		this.createForm();

		this.route.params
			.pipe(
				map((params) => params[STAFF_ID]),
				tap((staffID) => (this.staffID = +staffID)),
				switchMap((staffID) => {
					if (staffID) {
						return this.userApiSvc.getUserByID$(+staffID);
					}
					return of({} as User);
				}),
				debounceTime(0),
			)
			.subscribe((staffDetails) => {
				if (staffDetails) {
					this.updateForm(staffDetails);

					if (staffDetails?.practiceAvailability?.length) {
						const practice = {};
						staffDetails.practiceAvailability.forEach(({ rangeFromDate, rangeToDate, isRange, rangeIndex, ...availability }) => {
							if (practice?.[rangeIndex]) {
								practice[rangeIndex] = {
									...practice?.[rangeIndex],
									practice: [
										...practice?.[rangeIndex]?.practice,
										{
											...availability,
											dayStart: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayStart),
											dayEnd: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayEnd),
										},
									],
								};
							} else {
								practice[rangeIndex] = {
									rangeFromDate: rangeFromDate ? DateTimeUtils.UTCDateToLocalDate(new Date(rangeFromDate), true) : null,
									rangeToDate: rangeToDate ? DateTimeUtils.UTCDateToLocalDate(new Date(rangeToDate), true) : null,
									isRange,
									rangeIndex,
									practice: [
										{
											...availability,
											dayStart: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayStart),
											dayEnd: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayEnd),
										},
									],
								};
							}
						});
						Object.values(practice).forEach((value: any) => {
							if (value.isRange) {
								this.practiceAvailabilityArray.push(
									this.practiceAvailabilityGroup(value.isRange, value.rangeFromDate, value.rangeToDate, value.practice),
								);
							} else {
								this.practiceAvailabilityArray.controls?.[0].patchValue({
									isRange: value.isRange,
									practice: new BehaviorSubject(value.practice),
								});
							}
						});
					}
				}

				this.loading$$.next(false);
				this.staffDetails$$.next(staffDetails);
			});

		this.practiceHourApiSvc.practiceHoursWithTimeConversion$.pipe(take(1)).subscribe((practiceHours) => {
			this.practiceHourData$$.next(practiceHours);
		});

		this.userApiSvc.staffTypes$.pipe(takeUntil(this.destroy$$)).subscribe((staffTypes) => this.staffTypes$$.next(staffTypes));

		this.examApiSvc.allExams$
			.pipe(
				map((exams) =>
					exams.map(({ name, id }) => ({
						name,
						value: id.toString(),
					})),
				),
				takeUntil(this.destroy$$),
			)
			.subscribe((exams) => {
				this.exams$$.next(exams);
			});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => {
				this.selectedLang = lang;
				switch (lang) {
					case ENG_BE:
						this.statuses = Statuses;
						break;
					case DUTCH_BE:
						this.statuses = StatusesNL;
						break;
				}
			});
	}

	public override ngOnDestroy() {
		localStorage.removeItem(COMING_FROM_ROUTE);
		localStorage.removeItem(EDIT);
		localStorage.removeItem(STAFF_ID);
		super.ngOnDestroy();
	}

	public handleRadioButtonChange(toggle: boolean): void {
		//  set practice availability toggle
		this.addStaffForm.patchValue({ practiceAvailabilityToggle: toggle }, { emitEvent: false });
	}

	public saveStaff(): void {
		if (this.addStaffForm.invalid) {
			this.addStaffForm.markAllAsTouched();
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			return;
		}
		const { practiceAvailabilityToggle, practiceAvailabilityArray, ...rest } = this.formValues;

		let timeSlotFormValues: TimeSlotStaff[] = [];

		if (this.formValues.practiceAvailabilityToggle) {
			timeSlotFormValues = practiceAvailabilityArray
				?.map((practiceAvailability, index) => this.getFormRequestBody(practiceAvailability, index))
				.flatMap((value) => value);
		}

		if (this.formValues.practiceAvailabilityToggle && !timeSlotFormValues?.length) {
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			return;
		}
		this.submitting$$.next(true);

		const addStaffReqData: AddStaffRequestData = {
			...rest,
			availabilityType: practiceAvailabilityToggle ? 1 : 0,
			practiceAvailability: timeSlotFormValues,
		};

		if (!addStaffReqData.info) {
			delete addStaffReqData.info;
		}

		if (!addStaffReqData.address) {
			delete addStaffReqData.address;
		}

		if (!addStaffReqData.practiceAvailability?.length) {
			addStaffReqData.availabilityType = AvailabilityType.Unavailable;
		}

		addStaffReqData.id = Number.isNaN(+this.staffID) ? 0 : +this.staffID;

		this.userApiSvc
			.upsertUser$(addStaffReqData)
			.pipe(takeUntil(this.destroy$$))
			.subscribe(() => {
				if (this.staffID) {
					this.notificationSvc.showNotification(Translate.SuccessMessage.StaffUpdated[this.selectedLang]);
				} else {
					this.notificationSvc.showNotification(Translate.SuccessMessage.StaffAdded[this.selectedLang]);
				}

				let route: string;
				if (this.comingFromRoute === 'view') {
					route = '../view';
				} else {
					route = this.edit ? '/staff' : '../';
				}

				this.router.navigate([route], { relativeTo: this.route, queryParamsHandling: 'merge' });
			});
	}

	private getFormRequestBody(practiceAvailabilityObj: PracticeAvailability, rangeIndex: number): TimeSlotStaff[] {
		const { isRange, rangeFromDate, rangeToDate, practiceAvailability } = practiceAvailabilityObj;
		const timeSlots: TimeSlotStaff[] = [];

		Object.values(practiceAvailability.timeSlotGroup).forEach((values) => {
			values.forEach((value) => {
				if (value.dayStart && value.dayEnd) {
					timeSlots.push({
						// ...(value.id ? { id: value.id } : {}),
						dayStart: DateTimeUtils.LocalToUTCTimeTimeString(value.dayStart),
						dayEnd: DateTimeUtils.LocalToUTCTimeTimeString(value.dayEnd),
						weekday: value.weekday,
						isRange,
						rangeIndex,
						rangeFromDate,
						rangeToDate,
					});
				}
			});
		});

		return timeSlots;
	}

	public handleEmailInput(e: Event): void {
		const inputText = (e.target as HTMLInputElement).value;

		if (!inputText) {
			return;
		}

		if (!inputText.match(EMAIL_REGEX)) {
			this.addStaffForm.get('email')?.setErrors({
				email: true,
			});
		} else {
			this.addStaffForm.get('email')?.setErrors(null);
		}
	}

	private getComingFromRouteFromLocalStorage() {
		const comingFromRoute = localStorage.getItem(COMING_FROM_ROUTE);
		if (comingFromRoute) {
			this.comingFromRoute = comingFromRoute;
		}
		const edit = localStorage.getItem(EDIT);
		if (edit) {
			this.edit = edit === 'true';
		}
	}

	private createForm() {
		this.addStaffForm = this.fb.group({
			firstname: [null, [Validators.required]],
			lastname: [null, [Validators.required]],
			email: [null, [Validators.required]],
			telephone: [null, []],
			userType: [null, [Validators.required]],
			info: [null, []],
			status: [null ?? Status.Active, []],
			availabilityType: [AvailabilityType.Unavailable, []],
			practiceAvailabilityToggle: [false, []],
			practiceAvailabilityArray: this.fb.array([this.practiceAvailabilityGroup(false)]),
		});
	}

	private practiceAvailabilityGroup(isRange: boolean, rangeFromDate?: Date | string, rangeToDate?: Date | string, practice?: any[]): FormGroup {
		const practiceAvailability = this.fb.group({
			isRange: [isRange],
			rangeFromDate: [rangeFromDate ?? null, [Validators.required]],
			rangeToDate: [rangeToDate ?? null, [Validators.required]],
			practice: [new BehaviorSubject(practice ?? [])],
		});
		if (!isRange) {
			practiceAvailability.get('rangeFromDate')?.removeValidators(Validators.required);
			practiceAvailability.get('rangeToDate')?.removeValidators([Validators.required]);
		}

		practiceAvailability
			.get('rangeFromDate')
			?.valueChanges.pipe(takeUntil(this.destroy$$))
			.subscribe((value) => {
				console.log(value);
				practiceAvailability.get('rangeToDate')?.reset();
			});

		practiceAvailability
			.get('rangeToDate')
			?.valueChanges.pipe(takeUntil(this.destroy$$))
			.subscribe(() => {
				this.toggleOverlapError();
			});

		return practiceAvailability;
	}

	private toggleOverlapError() {
		let invalid = false;
		for (let i = 0; i < (this.addStaffForm.get('practiceAvailabilityArray') as FormArray)?.controls?.length; i++) {
			const firstControl = (this.addStaffForm.get('practiceAvailabilityArray') as FormArray)?.controls[i];
			const isRange = firstControl.get('isRange')?.value;
			if (!isRange) {
				continue;
			}
			const rangeFromDate = firstControl.get('rangeFromDate')?.value;
			const rangeToDate = firstControl.get('rangeToDate')?.value;
			for (let j = i + 1; j < (this.addStaffForm.get('practiceAvailabilityArray') as FormArray)?.controls?.length; j++) {
				const secondControl = (this.addStaffForm.get('practiceAvailabilityArray') as FormArray)?.controls[j];
				const isRange = secondControl.get('isRange')?.value;
				if (!isRange) {
					continue;
				}
				const otherRangeFromDate = secondControl.get('rangeFromDate')?.value;
				const otherRangeToDate = secondControl.get('rangeToDate')?.value;
				const startDate1 = new Date(rangeFromDate);
				const endDate1 = new Date(rangeToDate);
				const startDate2 = new Date(otherRangeFromDate);
				const endDate2 = new Date(otherRangeToDate);

				if (startDate1 < endDate2 && endDate1 > startDate2) {
					secondControl.get('rangeToDate')?.setErrors({ dateRangeOverlap: true });
					firstControl.get('rangeToDate')?.setErrors({ dateRangeOverlap: true });
					invalid = true;
				}
			}
			if (!invalid) {
				firstControl.get('rangeToDate')?.setErrors(null);
			}
		}
	}

	public get practiceAvailabilityArray(): FormArray {
		return this.addStaffForm.get('practiceAvailabilityArray') as FormArray;
	}

	private updateForm(staffDetails?: User): void {
		this.addStaffForm.patchValue({
			firstname: staffDetails?.firstname,
			lastname: staffDetails?.lastname,
			email: staffDetails?.email,
			telephone: staffDetails?.telephone,
			info: staffDetails?.info,
			status: staffDetails?.status ?? Status.Active,
			availabilityType: !!staffDetails?.availabilityType,
			practiceAvailabilityToggle: !!staffDetails?.practiceAvailability?.length,
		});

		setTimeout(() => {
			this.addStaffForm.get('userType')?.setValue(staffDetails?.userType);
			this.addStaffForm.get('userType')?.markAsUntouched();
		}, 0);
	}

	public addMoreRange() {
		this.practiceAvailabilityArray.push(this.practiceAvailabilityGroup(true));
		this.selectedIndex = this.practiceAvailabilityArray.length - 1;
	}

	public removeRange(i: number) {
		this.practiceAvailabilityArray.removeAt(i);
		this.selectedIndex = this.practiceAvailabilityArray.length - 1;
	}

	public dateFilter(d: Date | null): boolean {
		const day = (d || new Date()).getDay();
		// Prevent all days accept Mondays.
		return day == 1;
	}
}
