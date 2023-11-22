import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, SkipSelf, inject } from '@angular/core';
import { AbstractControl, ControlContainer, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BadgeColor, NotificationType } from 'diflexmo-angular-design';
import { BehaviorSubject, debounceTime, filter, takeUntil } from 'rxjs';
import { NotificationDataService } from '../../../core/services/notification-data.service';
import { ShareDataService } from '../../../core/services/share-data.service';
import { timeSlotRequiredValidator } from '../../customValidators/time-slot-required.validator';
import { Weekday } from '../../models/calendar.model';
import { TimeSlot, TimeSlotFormValues } from '../../models/time-slot.model';
import { Translate } from '../../models/translate.model';
import { ENG_BE, TIME_24 } from '../../utils/const';
import { DateTimeUtils } from '../../utils/date-time.utils';
import { getNumberArray } from '../../utils/getNumberArray';
import { toggleControlError } from '../../utils/toggleControlError';
import { DestroyableComponent } from '../destroyable.component';

@Component({
	selector: 'dfm-time-slots',
	templateUrl: './time-slots.component.html',
	styleUrls: ['./time-slots.component.scss'],
	viewProviders: [
		{
			provide: ControlContainer,
			useFactory: () => inject(ControlContainer, { skipSelf: true }),
		},
	],
})
export class TimeSlotsComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public weekdayEnum = Weekday;

	public readonly invalidTimeError: string = 'invalidTime';

	public readonly invalidSlotRangeError: string = 'invalidSlot';

	public readonly slotExistsError: string = 'slotExists';

	private selectedLang: string = ENG_BE;

	@Input() public interval = 5;

	@Input() controlKey: string = 'timeSlotForm';

	@Input() public timeSlotData$$ = new BehaviorSubject<TimeSlot[]>([]);

	@Input() public practiceHourData$$ = new BehaviorSubject<TimeSlot[]>([]);

	@Input() public dynamicRendering: boolean = true;

	constructor(
		private fb: FormBuilder,
		private cdr: ChangeDetectorRef,
		private notificationSvc: NotificationDataService,
		private shareDataSvc: ShareDataService,
		@SkipSelf() private parentContainer: ControlContainer,
	) {
		super();
	}

	public ngOnInit(): void {
		this.createForm();
		this.timeSlotData$$
			.pipe(
				takeUntil(this.destroy$$),
				filter((d) => !!d?.length),
			)
			.subscribe({
				next: (timeSlots) => {
					this.updateForm(timeSlots);
				},
			});
		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => (this.selectedLang = lang),
			});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	private get parentControl() {
		return this.parentContainer.control as FormGroup;
	}

	public get timeSlotForm() {
		return this.parentControl.get(this.controlKey) as FormGroup;
	}

	private createForm() {
		this.parentControl.addControl(
			this.controlKey,
			this.fb.group({
				selectedWeekday: [Weekday.ALL, []],
				timeSlotGroup: this.getTimeSlotFormGroup(),
			}),
		);
		this.timeSlotForm.patchValue({ selectedWeekday: Weekday.ALL });
	}

	public fillWithPracticeHourData() {
		this.updateForm(this.practiceHourData$$.value);
	}

	private getTimeSlotFormGroup(): FormGroup {
		const formGroup = this.fb.group({});

		getNumberArray(6, 0).forEach((weekday) => {
			formGroup.addControl(weekday.toString(), this.fb.array([this.getTimeControlGroup(weekday)]));
		});

		return formGroup;
	}

	private getTimeControlGroup(weekday: string | number): FormGroup {
		const controlGroup = this.fb.group(
			{
				id: [],
				weekday: [weekday.toString(), []],
				dayStart: ['', []],
				dayEnd: ['', []],
			},
			{ validator: timeSlotRequiredValidator },
		);

		controlGroup
			.get('dayStart')
			?.valueChanges.pipe(takeUntil(this.destroy$$), debounceTime(0))
			.subscribe({
				next: (value) => this.handleError(value as string, controlGroup.get('dayEnd'), controlGroup.value.weekday),
			});
		controlGroup
			.get('dayEnd')
			?.valueChanges.pipe(takeUntil(this.destroy$$), debounceTime(0))
			.subscribe({
				next: (value) => this.handleError(value as string, controlGroup.get('dayStart'), controlGroup.value.weekday),
			});

		return controlGroup;
	}

	public getFormArray(weekday: number | string): FormArray {
		return (this.timeSlotForm.get('timeSlotGroup') as FormGroup).get(weekday.toString()) as FormArray;
	}

	public get formValues(): TimeSlotFormValues {
		return this.timeSlotForm.value;
	}

	public getBadgeColor(selectedTab: number): BadgeColor {
		if (this.formValues?.selectedWeekday === selectedTab) {
			return 'secondary';
		}

		if (selectedTab === Weekday.ALL) {
			for (let i = 0; i < 7; i++) {
				if (!this.formValues.timeSlotGroup[i.toString()]?.every((pa) => pa?.dayEnd && pa?.dayStart)) {
					return 'gray';
				}
			}

			return 'gray';
		}

		const practiceHours = this.formValues.timeSlotGroup[selectedTab.toString()];
		if (practiceHours?.length && practiceHours.every((pa) => pa.dayEnd && pa.dayStart)) {
			return 'primary';
		}

		return 'gray';
	}

	public selectWeekday(weekday: Weekday) {
		if (this.formValues.selectedWeekday !== weekday) {
			this.timeSlotForm.patchValue({ selectedWeekday: weekday });
			this.cdr.detectChanges();
		}
	}

	public removeSlot(weekday: number, i: number) {
		const fa = this.getFormArray(weekday);

		if (fa.length === 1) {
			fa.controls[i].patchValue({
				dayStart: null,
				dayEnd: null,
			});

			fa.controls[i].markAsUntouched();

			return;
		}

		fa.removeAt(i);
		const formArrays = this.getFormArray(weekday.toString());
		this.handleInvalidSlotRangeError([formArrays]);
		this.handleSlotExistsError([formArrays]);
	}

	public addSlot(weekday: number) {
		const fa = this.getFormArray(weekday);
		if (fa.controls.every((control) => control.value.dayStart && control.value.dayEnd)) {
			fa.push(this.getTimeControlGroup(weekday));
		} else {
			this.notificationSvc.showNotification(Translate.FillSlot[this.selectedLang], NotificationType.WARNING);
		}
	}

	private updateForm(timeSlots: TimeSlot[]) {
		const weekdaySet = new Set();

		timeSlots.forEach((timeSlot) => {
			const fa = this.getFormArray(timeSlot.weekday);

			if (!weekdaySet.has(timeSlot.weekday)) {
				fa.clear();
				weekdaySet.add(timeSlot.weekday);
			}

			fa.push(this.getTimeControlGroup(timeSlot.weekday));

			const control = fa.at(fa.length - 1);

			if (control) {
				// To defer value update at end
				setTimeout(() => {
					this.patchUpdatedValues(control, timeSlot);
				}, 0);
			}
		});
		this.cdr.detectChanges();
	}

	private patchUpdatedValues(control: AbstractControl<any>, timeSlot: TimeSlot) {
		control.patchValue(
			{
				id: timeSlot.id,
				dayStart: DateTimeUtils.TimeStringIn24Hour(timeSlot.dayStart),
				dayEnd: DateTimeUtils.TimeStringIn24Hour(timeSlot.dayEnd),
				weekday: timeSlot.weekday,
			},
			{ emitEvent: false },
		);
	}

	private handleInvalidTimeError(time: string, control: AbstractControl | null | undefined) {
		if (!time) {
			toggleControlError(control, this.invalidTimeError, false);
			return;
		}

		if (!time.match(TIME_24)) {
			toggleControlError(control, this.invalidTimeError);
			return;
		}

		toggleControlError(control, this.invalidTimeError, false);
	}

	private handleInvalidSlotRangeError(controlArrays: FormArray[]) {
		for (let i = 0; i < controlArrays.length; i++) {
			for (let j = 0; j < controlArrays[i].length; j++) {
				const dayStart = controlArrays[i].controls[j].get('dayStart');
				const dayEnd = controlArrays[i].controls[j].get('dayEnd');

				if (dayStart?.value && dayEnd?.value) {
					if (DateTimeUtils.TimeToNumber(dayStart.value) >= DateTimeUtils.TimeToNumber(dayEnd?.value)) {
						toggleControlError(dayStart, this.invalidSlotRangeError);
						toggleControlError(dayEnd, this.invalidSlotRangeError);
						return;
					}
				}

				toggleControlError(dayStart, this.invalidSlotRangeError, false);
				toggleControlError(dayEnd, this.invalidSlotRangeError, false);
			}
		}
	}

	private handleSlotExistsError(controlArrays: FormArray[]) {
		controlArrays.forEach((formArray) => {
			const { controls } = formArray;
			if (formArray.length > 1) {
				for (let i = 0; i < formArray.length - 1; i++) {
					const compareWithControl = controls[i];

					for (let j = i + 1; j < formArray.length; j++) {
						const currControl = controls[j];

						if (currControl.value.dayStart && currControl.value.dayEnd) {
							if (
								DateTimeUtils.CheckTimeRangeOverlapping(
									compareWithControl.value.dayStart,
									compareWithControl.value.dayEnd,
									currControl.value.dayStart,
									currControl.value.dayEnd,
								)
							) {
								toggleControlError(currControl.get('dayStart'), this.slotExistsError);
								toggleControlError(currControl.get('dayEnd'), this.slotExistsError);
								toggleControlError(compareWithControl.get('dayStart'), this.slotExistsError);
								toggleControlError(compareWithControl.get('dayEnd'), this.slotExistsError);
							} else {
								toggleControlError(currControl.get('dayStart'), this.slotExistsError, false);
								toggleControlError(currControl.get('dayEnd'), this.slotExistsError, false);
								toggleControlError(compareWithControl.get('dayStart'), this.slotExistsError, false);
								toggleControlError(compareWithControl.get('dayEnd'), this.slotExistsError, false);
							}
						}
					}
				}
			} else if (formArray.length === 1) {
				toggleControlError(controls[0].get('dayStart'), this.slotExistsError, false);
				toggleControlError(controls[0].get('dayEnd'), this.slotExistsError, false);
			}
		});
	}

	private handleError(time: string, control: AbstractControl | null | undefined, weekday: string | number | null | undefined) {
		//  Handling invalid time input
		this.handleInvalidTimeError(time, control);

		// Handling slot errors
		if (weekday) {
			const controlArrays = this.getFormArray(weekday.toString());
			this.handleInvalidSlotRangeError([controlArrays]);
			this.handleSlotExistsError([controlArrays]);
		}
	}
}
