import {
	AfterContentChecked,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	SimpleChanges,
	ViewChild,
} from '@angular/core';
import { BehaviorSubject, Subject, debounceTime, filter, firstValueFrom, map, startWith, take, takeUntil, throttleTime } from 'rxjs';
import { getDaysOfMonth, getDurationMinutes, getWeekdayWiseDays, Weekday } from '../../../models/calendar.model';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';
import { AddAppointmentModalComponent } from 'src/app/modules/appointments/components/add-appointment-modal/add-appointment-modal.component';
import { ModalService } from 'src/app/core/services/modal.service';
import { DraggableService } from 'src/app/core/services/draggable.service';
import { CalendarType, DUTCH_BE, ENG_BE } from 'src/app/shared/utils/const';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { DestroyableComponent } from '../../destroyable.component';
import { AppointmentSlotsRequestData } from 'src/app/shared/models/appointment.model';
import { Translate } from 'src/app/shared/models/translate.model';
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';
import { NotificationDataService } from 'src/app/core/services/notification-data.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';

@Component({
	selector: 'dfm-calendar-month-view',
	templateUrl: './dfm-calendar-month-view.component.html',
	styleUrls: ['./dfm-calendar-month-view.component.scss'],
})
export class DfmCalendarMonthViewComponent extends DestroyableComponent implements OnInit, OnDestroy, OnChanges, AfterContentChecked {
	public weekDayEnum = Weekday;

	public nowDate = new Date();

	public daysInMonthMatrix: number[][] = [];

	public getDurationFn = (s, e) => getDurationMinutes(s, e);

	@Input()
	public selectedDate!: Date;

	@Input()
	public changeMonth$$ = new BehaviorSubject<number>(0);

	@Input()
	public newDate$$ = new BehaviorSubject<{ date: Date | null; isWeekChange: boolean }>({ date: null, isWeekChange: false });

	@Input()
	public dataGroupedByDate: { [key: string]: any[] } = {};

	@Output()
	public selectedDateEvent = new EventEmitter<Date>();

	@Output()
	public dayViewEvent = new EventEmitter<Date>();

	@Output()
	private dateChange = new EventEmitter<number>();

	@ViewChild('popOver') public popover!: NgbPopover;

	private changeDateDebounce$$ = new Subject<number>();

	public calendarType = CalendarType;

	private selectedLang: string = ENG_BE;

	constructor(
		private modalSvc: ModalService,
		private draggableSvc: DraggableService,
		private cdr: ChangeDetectorRef,
		private appointmentApiSvc: AppointmentApiService,
		private notificationSvc: NotificationDataService,
		private shareDataSvc: ShareDataService,
	) {
		super();
	}

	public ngOnChanges(changes: SimpleChanges) {
		if (!this.selectedDate) {
			this.selectedDate = new Date();
		}

		const currentValue = changes['dataGroupedByDate']?.currentValue;
		const previousValue = changes['dataGroupedByDate']?.previousValue;

		if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
			this.dataGroupedByDate = currentValue;
		}
	}

	public ngOnInit(): void {
		this.updateCalendarDays();

		this.changeDateDebounce$$.pipe(startWith(), throttleTime(700), takeUntil(this.destroy$$)).subscribe((value) => this.dateChange.emit(value));

		this.changeMonth$$
			.asObservable()
			.pipe(filter((offset) => !!offset))
			.subscribe({
				next: (offset) => this.changeMonth(offset),
			});

		this.newDate$$
			.asObservable()
			.pipe()
			.subscribe({
				next: ({ date }) => {
					if (date) {
						this.updateDate(date);
						this.updateCalendarDays();
					}
				},
			});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => {
				this.selectedLang = lang;
			});
	}

	public override ngOnDestroy(): void {
		super.ngOnDestroy();
	}

	public ngAfterContentChecked(): void {
		this.cdr.detectChanges();
	}

	public changeMonth(offset: number) {
		const year = this.selectedDate.getFullYear();
		const month = this.selectedDate.getMonth();

		// checking if prev or next month has today's date
		if (getDaysOfMonth(year, month + offset) < this.selectedDate.getDate()) {
			this.selectedDate.setDate(1);
		}

		this.selectedDate.setMonth(this.selectedDate.getMonth() + offset);

		// if selected month is today's month then selected today's date by default
		if (this.selectedDate.getMonth() === new Date().getMonth()) {
			this.selectedDate.setDate(new Date().getDate());
		}

		this.updateCalendarDays();
		this.emitDate();

		this.changeMonth$$.next(0);
	}

	private updateDate(date: Date) {
		this.selectedDate = new Date(date);
		this.emitDate();
	}

	private updateCalendarDays() {
		this.daysInMonthMatrix = getWeekdayWiseDays(this.selectedDate);
	}

	private emitDate() {
		this.selectedDateEvent.emit(this.selectedDate);
	}

	public async editAppointment({ day, data: appointment }) {
		if (appointment?.id && !appointment.isOutside) {
			const date = `${day[2]}-${day[1] + 1}-${day[0]}`;
			const reqData: AppointmentSlotsRequestData = {
				fromDate: date,
				toDate: date,
				date: date,
				exams: appointment.exams.map(({ id }) => id + ''),
			};
			const isSlotAvailable = await firstValueFrom(this.appointmentApiSvc.getSlots$(reqData).pipe(map((data) => !!data?.[0]?.slots?.length)));
			if (!isSlotAvailable) {
				this.notificationSvc.showWarning(Translate.NoSlotAvailable[this.selectedLang]);
				this.draggableSvc.revertDrag();
				return;
			}
		}
		this.modalSvc
			.open(AddAppointmentModalComponent, {
				data: {
					startedAt: new Date(day[2], day[1], day[0]),
					isOutside: appointment.isOutside,
					appointment,
				},
				options: {
					size: 'xl',
					backdrop: false,
					centered: true,
					modalDialogClass: 'ad-ap-modal-shadow',
				},
			})
			.closed.pipe(take(1))
			.subscribe({
				next: (res) => {
					this.draggableSvc.revertDrag(!!res);
				},
			});
	}

	public changeToDayView(day: number, month: number, year: number) {
		const date = new Date(year, month, day);
		this.dayViewEvent.emit(date);
	}

	public changeDate(offset: number) {
		if (!this.draggableSvc.dragStartElement) return;
		this.changeDateDebounce$$.next(offset);
	}

	public removeDuplicateData(data: any): Array<any> {
		const arr: any = [];
		data?.forEach((user) => {
			if (user?.users.length) arr.push(...user.users);
		});
		if (arr.length) return GeneralUtils.removeDuplicateData(arr, 'id');
		return [];
	}
}
