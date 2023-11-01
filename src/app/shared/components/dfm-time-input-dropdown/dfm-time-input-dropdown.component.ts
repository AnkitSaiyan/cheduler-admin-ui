import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputSize } from 'diflexmo-angular-design';
import { Subject, debounceTime, distinctUntilChanged, filter, take, takeUntil } from 'rxjs';
import { NameValuePairPipe } from '../../pipes/name-value-pair.pipe';
import { TimeInIntervalPipe } from '../../pipes/time-in-interval.pipe';
import { TIME_24 } from '../../utils/const';
import { DateTimeUtils } from '../../utils/date-time.utils';
import { GeneralUtils } from '../../utils/general.utils';
import { toggleControlError } from '../../utils/toggleControlError';
import { DestroyableComponent } from '../destroyable.component';
import { NameValue } from '../search-modal.component';

@Component({
	selector: 'dfm-time-input-dropdown',
	templateUrl: './dfm-time-input-dropdown.component.html',
	styleUrls: ['./dfm-time-input-dropdown.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: DfmTimeInputDropdownComponent,
			multi: true,
		},
	],
})
export class DfmTimeInputDropdownComponent extends DestroyableComponent implements OnInit, ControlValueAccessor, OnDestroy {
	constructor(private nameValuePipe: NameValuePairPipe, private timeInIntervalPipe: TimeInIntervalPipe) {
		super();
	}

	@Input() label!: string;
	@Input() placeholder!: string;
	@Input() size: InputSize = 'md';
	@Input() public interval = 5;

	private times: NameValue[] = [];

	public filteredTimes: NameValue[] = [];

	public readonly invalidTimeError: string = 'invalidTime';

	public appendItems$$ = new Subject<void>();

	public control = new FormControl<string | null>(null);

	private onChange = (value: string | null) => {};

	private onTouch = () => {};

	private clearTimeOut: NodeJS.Timeout[] = [];

	writeValue(obj: any): void {
		if (obj) {
			this.appendItems$$.next();
		}
		this.clearTimeOut.push(
			setTimeout(() => {
				this.control.setValue(obj, { emitEvent: false });
			}, 0),
		);
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.control.disable();
		} else {
			this.control.enable();
		}
	}

	ngOnInit() {
		this.appendItems$$.pipe(take(1)).subscribe(() => {
			this.times = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(this.interval))];
			this.filteredTimes = [...this.times];
		});

		this.control.valueChanges
			.pipe(
				debounceTime(0),
				distinctUntilChanged(),
				filter((value) => value === null),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: () => (this.filteredTimes = [...GeneralUtils.FilterArray(this.times, '', 'value')]),
			});

		this.control.valueChanges.pipe(debounceTime(0), filter(Boolean), distinctUntilChanged(), takeUntil(this.destroy$$)).subscribe({
			next: (value) => {
				this.onChange(value);
				this.onTouch();
			},
		});
	}

	public override ngOnDestroy(): void {
		this.destroy$$.next();
		this.destroy$$.complete();
		this.clearTimeOut.forEach((timeOut) => clearTimeout(timeOut));
	}

	public handleTimeInput(time: string) {
		this.searchTime(time);
		const formattedTime = DateTimeUtils.FormatTime(time, 24, 5);
		if (!formattedTime) {
			return;
		}

		const nameValue = {
			name: formattedTime,
			value: formattedTime,
		};

		if (!this.filteredTimes.find((t) => t.value === formattedTime)) {
			this.filteredTimes.splice(0, 0, nameValue);
		}

		console.log('time', time);

		this.control.setValue(formattedTime, { emitEvent: false, onlySelf: true });
	}
	public handleTimeFocusOut(time: string) {
		this.handleError(time);
	}

	private searchTime(time: string) {
		this.filteredTimes = [...GeneralUtils.FilterArray(this.times, time, 'value')];
	}

	private handleError(time: string) {
		this.handleInvalidTimeError(time);
	}

	private handleInvalidTimeError(time: string) {
		if (!time) {
			toggleControlError(this.control, this.invalidTimeError, false);
			return;
		}

		if (!time.match(TIME_24)) {
			toggleControlError(this.control, this.invalidTimeError);
			return;
		}

		toggleControlError(this.control, this.invalidTimeError, false);
	}
}

