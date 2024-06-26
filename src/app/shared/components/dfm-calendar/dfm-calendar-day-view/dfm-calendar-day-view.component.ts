import { DatePipe } from '@angular/common';
import {
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	Renderer2,
	SimpleChanges,
	ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, firstValueFrom, map, switchMap, take, takeUntil } from 'rxjs';
import { AbsenceApiService } from 'src/app/core/services/absence-api.service';
import { DraggableService } from 'src/app/core/services/draggable.service';
import { PermissionService } from 'src/app/core/services/permission.service';
import { UserRoleEnum } from 'src/app/shared/models/user.model';
import { CalendarType, ENG_BE, PIXELS_PER_MIN, TIME_INTERVAL } from 'src/app/shared/utils/const';
import { DateTimeUtils } from 'src/app/shared/utils/date-time.utils';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ShareDataService } from '../../../../core/services/share-data.service';
import { AddAppointmentModalComponent } from '../../../../modules/appointments/components/add-appointment-modal/add-appointment-modal.component';
import { AppointmentTimeChangeModalComponent } from '../../../../modules/appointments/components/appointment-time-change-modal/appointment-time-change-modal.component';
import { ChangeRadiologistModalComponent } from '../../../../modules/appointments/components/change-radiologist-modal/change-radiologist-modal.component';
import {
	AddAppointmentRequestData,
	Appointment,
	AppointmentSlotsRequestData,
	UpdateDurationRequestData,
	UpdateRadiologistRequestData,
} from '../../../models/appointment.model';
import { CalenderTimeSlot, Interval, dataModification, getDurationMinutes, getFromAndToDate } from '../../../models/calendar.model';
import { Exam, ResourceBatch } from '../../../models/exam.model';
import { ReadStatus } from '../../../models/status.model';
import { Translate } from '../../../models/translate.model';
import { getAddAppointmentRequestData } from '../../../utils/getAddAppointmentRequestData';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../confirm-action-modal.component';
import { DestroyableComponent } from '../../destroyable.component';
import { NameValue } from '../../search-modal.component';

@Component({
	selector: 'dfm-calendar-day-view',
	templateUrl: './dfm-calendar-day-view.component.html',
	styleUrls: ['./dfm-calendar-day-view.component.scss'],
	encapsulation: ViewEncapsulation.None,
})
export class DfmCalendarDayViewComponent extends DestroyableComponent implements OnInit, OnChanges, OnDestroy {
	@Input()
	public changeDate$$ = new BehaviorSubject<number>(0);

	@Input()
	public headerList: NameValue[] = [];

	@Input()
	public newDate$$ = new BehaviorSubject<{ date: Date | null; isWeekChange: boolean }>({ date: null, isWeekChange: false });

	@Input()
	public prioritySlots!: { [key: string]: any[] };

	@Input()
	public timeSlot!: CalenderTimeSlot;

	@Input()
	public appointmentData: {
		[key: string]: {
			[key: number]: {
				appointment: Appointment;
				exams: Exam[];
			}[];
		};
	} = {};

	@Input()
	public absenceData: { [key: string]: any[] } = {};

	@Input()
	public format24Hour = false;

	@Input()
	public disableDblClick = false;

	@Output()
	public selectedDateEvent = new EventEmitter<Date>();

	@Output()
	public deleteAppointmentEvent = new EventEmitter<number>();

	public calendarType = CalendarType;

	public selectedDate!: Date;

	public selectedDateOnly!: number;

	public todayDate = new Date();

	public dateString!: string;

	public readonly timeInterval: number = TIME_INTERVAL;

	public readonly pixelsPerMin: number = PIXELS_PER_MIN;

	public lastOpenedMenuRef!: NgbDropdown | null;

	public addingAppointment = false;

	public grayOutSlot$$: BehaviorSubject<any[]> = new BehaviorSubject<Interval[]>([]);

	private lastScrollTime: number = 0;

	private requestId: number | null = null;

	private selectedLang: string = ENG_BE;

	private pixelPerMinute = 4;

	private minimum_size = 20;

	private original_height = 0;

	private original_y = 0;

	private original_mouse_y = 0;

	private currentResizer!: HTMLDivElement;

	private element!: HTMLDivElement;

	private minutesInBottom!: number;

	public isMobile: boolean = false;

	private resizeListener: any;

	private mouseUpEve: any;

	public hideAppointmentData = {};

	public hideAbsenceData = {};

	public isHoliday$$ = new BehaviorSubject<boolean>(false);

	public day: any = [];

	constructor(
		private datePipe: DatePipe,
		private appointmentApiSvc: AppointmentApiService,
		private notificationSvc: NotificationDataService,
		private modalSvc: ModalService,
		private shareDataSvc: ShareDataService,
		public permissionSvc: PermissionService,
		private translatePipe: TranslatePipe,
		private translate: TranslateService,
		private renderer: Renderer2,
		public draggableSvc: DraggableService,
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute,
		private absenceApiSvc: AbsenceApiService,
	) {
		super();
		this.route.queryParams
			.pipe(
				filter(({ d }) => !!d),
				takeUntil(this.destroy$$),
			)
			.subscribe(({ d }) => {
				const date = d.split('-');
				this.day = [+date[2], +date[1], date[0]];
				if (date) this.selectedDate = new Date(date[0], date[1] - 1, date[2], 0, 0, 0, 0);
			});
	}

	public ngOnChanges(changes: SimpleChanges) {
		if (!this.selectedDate) {
			this.updateDate(new Date());
		}

		const currentValue = changes['dataGroupedByDateAndRoom']?.currentValue;
		const previousValue = changes['dataGroupedByDateAndRoom']?.previousValue;
		if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
			this.appointmentData = currentValue;
		}
		if (this.timeSlot?.timings?.length) {
			this.setHideAbsence(this.absenceData);
		}
		this.getGrayOutArea(this.timeSlot);
		const date: string = this.datePipe.transform(this.selectedDate, 'd-M-yyyy')!;
		this.hideAppointmentData = {};
		if (this.appointmentData[date]) {
			Object.values(this.appointmentData[date]).forEach((data) => {
				data.forEach(({ appointment }) => {
					this.getTop(appointment, true);
				});
			});
		}
		this.cdr.detectChanges();
	}

	public ngOnInit(): void {
		this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent);
		this.changeDate$$
			.asObservable()
			.pipe(filter((offset) => !!offset))
			.subscribe({
				next: (offset) => this.changeDate(offset),
			});

		this.newDate$$
			.asObservable()
			.pipe(
				distinctUntilChanged((pre, curr) => {
					return pre.date?.toLocaleDateString() === curr.date?.toLocaleDateString();
				}),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: ({ date }) => {
					if (date) {
						this.updateDate(date);
					}
				},
			});

		this.shareDataSvc
			.getDate$()
			.pipe(
				filter((date) => !!date),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (date) => this.newDate$$.next({ date: new Date(date), isWeekChange: false }),
			});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => (this.selectedLang = lang),
			});

		this.route.queryParams
			.pipe(
				filter(Boolean),
				debounceTime(100),
				filter((queryParams: Params) => !!queryParams['v'] && !!queryParams['d']),
				map((data) => getFromAndToDate(data)),
				switchMap(({ fromDate, toDate }) => {
					return this.absenceApiSvc.absencesHolidayForCalendar$(fromDate, toDate);
				}),
				map((data) => dataModification(data.data, this.datePipe)),
				takeUntil(this.destroy$$),
			)
			.subscribe((data) => {
				const selectedDate = this.datePipe.transform(this.selectedDate, 'd-M-yyyy') ?? '';
				const Holiday: boolean = Boolean(
					data[selectedDate] &&
						data[selectedDate].some(({ isHoliday }) => isHoliday),
				);
				this.isHoliday$$.next(Holiday);
			});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	private setHideAbsence(absence: { [key: string]: any[] }) {
		this.hideAbsenceData = {};
		if (Object.keys(absence)?.length) {
			Object.entries(absence).forEach(([key, data]) => {
				data.forEach((abse) => {
					if (
						DateTimeUtils.TimeToNumber(abse.end) < DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(this.timeSlot?.timings?.[0])) ||
						DateTimeUtils.TimeToNumber(abse.start) >
							DateTimeUtils.TimeToNumber(DateTimeUtils.UTCTimeToLocalTimeString(this.timeSlot?.timings?.[this.timeSlot.timings.length - 1]) ?? '') + 1
					) {
						if (this.hideAbsenceData[key]) {
							this.hideAbsenceData[key] = [...this.hideAbsenceData[key], absence];
						} else {
							this.hideAbsenceData[key] = [absence];
						}
					}
				});
			});
		}
	}

	public getTop(groupedData: any, storeHiddenAppointment: boolean = false): number {
		const start = DateTimeUtils.timeStingToDate(this.timeSlot?.timings?.[0]);
		start.setDate(this.selectedDate.getDate());
		start.setMonth(this.selectedDate.getMonth());
		start.setFullYear(this.selectedDate.getFullYear());
		const end = new Date(groupedData.startedAt);
		end.setMilliseconds(0);
		const isHiddenAppointmentInBottom = this.extendMinutesInBottom(groupedData) < 0;
		if (start.getTime() > end.getTime() || isHiddenAppointmentInBottom) {
			if (storeHiddenAppointment) {
				if (this.hideAppointmentData[groupedData?.exams?.[0]?.rooms?.[0]?.name]) {
					this.hideAppointmentData[groupedData?.exams?.[0]?.rooms?.[0]?.name] = [
						...this.hideAppointmentData[groupedData?.exams?.[0]?.rooms?.[0]?.name],
						groupedData,
					];
				} else {
					this.hideAppointmentData[groupedData?.exams?.[0]?.rooms?.[0]?.name] = [groupedData];
				}
			}

			return -1;
		}
		const minutes = getDurationMinutes(start, end);
		return minutes * this.pixelsPerMin;
	}

	public toggleMoreMenu(moreMenu: NgbDropdown) {
		moreMenu.toggle();

		if (this.lastOpenedMenuRef && this.lastOpenedMenuRef !== moreMenu) {
			this.lastOpenedMenuRef.close();
		}

		if (this.lastOpenedMenuRef !== moreMenu) {
			this.lastOpenedMenuRef = moreMenu;
		}
	}

	public changeRadiologists(appointment: Appointment) {
		const modalRef = this.modalSvc.open(ChangeRadiologistModalComponent, {
			data: appointment,
		});

		modalRef.closed
			.pipe(
				filter((res) => !!res),
				switchMap((ids: number[]) => {
					const resourcesBatch = this.getResourceBatchAndRoomID(appointment);
					const requestData = {
						appointmentId: appointment.id,
						examId: appointment?.exams?.[0].id,
						appointmentResourceBatchId: resourcesBatch?.[0]?.appointmentResourcebatchId,
						roomId: resourcesBatch?.[0]?.rooms?.[0].id,
						userId: ids,
					} as UpdateRadiologistRequestData;

					return this.appointmentApiSvc.updateRadiologist$(requestData);
				}),
				take(1),
			)
			.subscribe({
				next: () => this.notificationSvc.showNotification(`${Translate.SuccessMessage.Updated[this.selectedLang]}!`),
			});
	}

	private getResourceBatchAndRoomID(appointment: Appointment): ResourceBatch[] | undefined {
		return appointment?.exams?.[0]?.resourcesBatch?.filter((batch) => batch.rooms[0].id === appointment?.exams?.[0]?.rooms?.[0].id);
	}

	public openChangeTimeModal(
		appointment: Appointment,
		extend: boolean,
		eventContainer: HTMLDivElement,
		position?: boolean,
		time?: number,
		divHieght?: number,
		divTop?: number,
	) {
		const htmlContainer: HTMLDivElement = eventContainer;
		this.minutesInBottom = this.extendMinutesInBottom(appointment);
		const top = eventContainer?.style.top;
		const height = eventContainer?.style.height;
		const modalRef = this.modalSvc.open(AppointmentTimeChangeModalComponent, {
			data: { extend, eventContainer, position, time, minutesInBottom: this.minutesInBottom },
			options: {
				backdrop: false,
				centered: true,
			},
		});

		if (divHieght) {
			htmlContainer.style.top = `${divTop}px`;
			htmlContainer.style.height = `${divHieght}px`;
		}

		modalRef.closed
			.pipe(
				filter((res) => !!res),
				switchMap((res) => {
					const requestData = {
						amountofMinutes: +res.minutes,
						extensionType: extend ? 'extend' : 'shorten',
						from: res.top ? 'AtTheTop' : 'AtTheBottom',
						appointmentId: appointment.id,
						examId: appointment?.exams?.[0].id,
						roomId: appointment?.exams?.[0]?.rooms?.length ? appointment?.exams?.[0]?.rooms[0]?.id : null,
					} as UpdateDurationRequestData;

					eventContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
					return this.appointmentApiSvc.updateAppointmentDuration$(requestData);
				}),
				take(1),
			)
			.subscribe({
				next: () => {
					this.notificationSvc.showSuccess(Translate.AppointmentUpdatedSuccessfully[this.selectedLang]);
				},
				error: () => {
					if (eventContainer) {
						// eslint-disable-next-line no-param-reassign
						eventContainer.style.top = divTop ? `${divTop}px` : top;
						// eslint-disable-next-line no-param-reassign
						eventContainer.style.height = divHieght ? `${divHieght}px` : height;
					}
				},
			});
	}

	public readAppointment(appointment: Appointment) {
		const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Read Status Confirmation',
				confirmButtonText: 'Change',
				bodyText: `Are you sure you want to mark the appointment with Appointment No: ${appointment.id} as read?`,
			} as ConfirmActionModalData,
		});

		modalRef.closed
			.pipe(
				filter((res) => !!res),
				switchMap(() => {
					const requestData = {
						...getAddAppointmentRequestData(appointment, true, { readStatus: ReadStatus.Read }),
					} as AddAppointmentRequestData;

					return this.appointmentApiSvc.updateAppointment$(requestData);
				}),
				take(1),
			)
			.subscribe({
				next: () => this.notificationSvc.showNotification('Appointment has been read'),
			});
	}

	public deleteAppointment(id: number) {
		const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreYouSureWantToDeleteAppointment',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		dialogRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.appointmentApiSvc.deleteAppointment$(+id)),
				take(1),
			)
			.subscribe({
				next: () => this.notificationSvc.showNotification(`${Translate.SuccessMessage.Deleted[this.selectedLang]}!`),
			});
	}

	public async addAppointment(e: MouseEvent, eventsContainer?: HTMLDivElement, appointment?: Appointment) {
		if (this.permissionSvc.permissionType === UserRoleEnum.Reader || this.disableDblClick) return;
		const currentDate = new Date();

		let minutes = Math.round(+e.offsetY / this.pixelPerMinute);

		// In case if calendar start time is not 00:00 then adding extra minutes
		if (this.timeSlot?.timings?.[0]) {
			const startTime = this.timeSlot?.timings?.[0].split(':');
			minutes += DateTimeUtils.DurationInMinFromHour(+startTime[0], +startTime[1]);
		}
		const roundedMin = minutes - (minutes % 5);
		const hour = Math.floor(minutes / 60);
		const min = roundedMin % 60;
		const currentSelectedTime = new Date(this.selectedDate);
		currentSelectedTime.setHours(hour);
		currentSelectedTime.setMinutes(min);

		const currentTimeInLocal = DateTimeUtils.UTCDateToLocalDate(currentSelectedTime);

		if (currentTimeInLocal.getTime() < currentDate.getTime()) {
			this.notificationSvc.showWarning(this.translatePipe.transform(`CanNotAddAppointmentOnPastDate`));
			this.draggableSvc.revertDrag();
			return;
		}

		if (!e.offsetY) return;

		const isOutside = this.grayOutSlot$$.value.some((value) => e.offsetY >= value.top && e.offsetY <= value.top + value.height);

		if (isOutside) {
			const res = await firstValueFrom(
				this.modalSvc.open(ConfirmActionModalComponent, {
					data: {
						titleText: 'AddAppointmentConfirmation',
						bodyText: 'AreYouSureWantToMakeAppointmentOutsideOperatingHours',
						confirmButtonText: 'Yes',
					} as ConfirmActionModalData,
					options: {
						backdrop: false,
						centered: true,
					},
				}).closed,
			);
			if (!res) {
				this.draggableSvc.revertDrag();
				return;
			}
		}

		if (appointment?.id && !isOutside) {
			const date: string = this.datePipe.transform(this.selectedDate, 'yyyy-M-dd')!;
			const reqData: AppointmentSlotsRequestData = {
				fromDate: date,
				toDate: date,
				date,
				exams: appointment?.exams?.map(({ id }) => `${id}`) ?? [],
				AppointmentId: appointment?.id,
			};
			this.cdr.detectChanges();
			const isSlotAvailable = await firstValueFrom(this.appointmentApiSvc.getSlots$(reqData).pipe(map((data) => !!data?.[0]?.slots?.length)));
			if (!isSlotAvailable) {
				this.notificationSvc.showWarning(Translate.NoSlotAvailable[this.selectedLang]);
				this.draggableSvc.revertDrag();
				return;
			}
		}
		const eventCard: HTMLDivElement | undefined = eventsContainer ? this.createAppointmentCard(e, eventsContainer) : undefined;

		this.modalSvc
			.open(AddAppointmentModalComponent, {
				data: {
					event: e,
					element: eventCard,
					elementContainer: eventsContainer,
					startedAt: this.selectedDate,
					startTime: this.timeSlot?.timings?.[0],
					isOutside,
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
					eventCard?.remove();
					this.draggableSvc.revertDrag(res);
				},
			});
	}

	public onScroll(scrolledElement: HTMLElement, targetElement: HTMLElement) {
		const now = performance.now();

		if (!this.lastScrollTime || now - this.lastScrollTime > 16) {
			// eslint-disable-next-line no-param-reassign
			targetElement.scrollLeft = scrolledElement.scrollLeft;
			// eslint-disable-next-line no-param-reassign
			targetElement.scrollTop = scrolledElement.scrollTop;

			this.lastScrollTime = now;
		} else if (!this.requestId) {
			this.requestId = window.requestAnimationFrame(() => {
				// eslint-disable-next-line no-param-reassign
				targetElement.scrollLeft = scrolledElement.scrollLeft;
				// eslint-disable-next-line no-param-reassign
				targetElement.scrollTop = scrolledElement.scrollTop;
				this.lastScrollTime = performance.now();
				this.requestId = null;
			});
		}
	}

	@HostListener('document:click')
	private onclick = () => this.handleDocumentClick();

	private changeDate(offset: number) {
		if (this.selectedDate) {
			const date = new Date(this.selectedDate.setDate(this.selectedDate.getDate() + offset));
			this.updateDate(date);
			this.emitDate();
		}
	}

	private updateDate(date: Date) {
		date.setMinutes(date.getMinutes() - (date.getMinutes() % 5));
		this.selectedDate = date;
		this.selectedDateOnly = date.getDate();
		const dateString = this.datePipe.transform(date, 'd-M-yyyy');
		if (dateString) {
			this.dateString = dateString;
		}
		this.emitDate();
	}

	private emitDate(): void {
		this.selectedDateEvent.emit(this.selectedDate);
	}

	private handleDocumentClick() {
		// closing menu
		this.lastOpenedMenuRef?.close();
		this.lastOpenedMenuRef = null;
	}

	private createAppointmentCard(e: MouseEvent, eventsContainer: HTMLDivElement): HTMLDivElement {
		const top = e.offsetY - (e.offsetY % 20);
		const eventCard = document.createElement('div');
		eventCard.classList.add('calender-day-view-event-container');
		eventCard.style.height = `20px`;
		eventCard.style.top = `${top}px`;

		const appointmentText = document.createElement('span');

		appointmentText.innerText = this.translate.instant('Appointment');

		appointmentText.classList.add('appointment-title');

		eventCard.appendChild(appointmentText);
		eventsContainer.appendChild(eventCard);

		return eventCard;
	}

	private getGrayOutArea(timeSlot: CalenderTimeSlot) {
		const intervals = timeSlot?.intervals;
		const timings = timeSlot?.timings;
		if (!timings?.length) return;
		const grayOutSlot: any = [];
		const timeDuration = getDurationMinutes(DateTimeUtils.timeStingToDate(timings?.[0]), DateTimeUtils.timeStingToDate(intervals?.[0].dayStart));
		grayOutSlot.push({
			dayStart: timings?.[0],
			dayEnd: timings?.[0],
			top: 0,
			height: (timeDuration > 120 ? 120 : timeDuration) * this.pixelsPerMin,
		});
		const dayStart = intervals[intervals.length - 1].dayEnd;
		const startTime = DateTimeUtils.timeStingToDate(this.timeSlot?.timings?.[0]);
		const dayStartTime = DateTimeUtils.timeStingToDate(dayStart);
		const lastMinutes = getDurationMinutes(startTime, dayStartTime);
		const dayEnd = this.addMinutes(15, timings[timings.length - 1]);

		grayOutSlot.push({
			dayStart: intervals[intervals.length - 1].dayEnd,
			dayEnd,
			top: lastMinutes * this.pixelsPerMin,
			height: getDurationMinutes(dayStartTime, DateTimeUtils.timeStingToDate(dayEnd)) * this.pixelsPerMin,
		});

		if (intervals?.length > 1) {
			for (let i = 0; i < intervals.length - 1; i++) {
				const start = DateTimeUtils.timeStingToDate(this.timeSlot?.timings?.[0]);
				const end = DateTimeUtils.timeStingToDate(intervals[i].dayEnd);
				const minutes = getDurationMinutes(start, end);
				const timeInterval = getDurationMinutes(end, DateTimeUtils.timeStingToDate(intervals[i + 1].dayStart));
				grayOutSlot.push({
					dayStart: intervals[i].dayEnd,
					dayEnd: intervals[i + 1].dayStart,
					top: minutes * this.pixelsPerMin,
					height: timeInterval * this.pixelsPerMin,
				});
			}
		}
		this.grayOutSlot$$.next([...grayOutSlot]);
	}

	private subtractMinutes(minutes: number, time: string): string {
		const date = new Date();
		const [hour, minute] = time.split(':');
		date.setHours(+hour);
		date.setMinutes(+minute);
		date.setSeconds(0);
		const subtractedDate = new Date(date.getTime() - minutes * 60 * 1000);
		return this.datePipe.transform(subtractedDate, 'HH:mm') ?? '';
	}

	public resize(e: any, resizer: HTMLDivElement, appointment: Appointment, container: HTMLDivElement): void {
		const htmlContainer: HTMLDivElement = container;
		this.minutesInBottom = this.extendMinutesInBottom(appointment);
		this.element = container;
		this.currentResizer = resizer;
		e.preventDefault();
		this.original_height = parseInt(container?.style.height, 10);
		this.original_y = parseInt(container?.style.top, 10);
		this.original_mouse_y = e.pageY;
		const isTopResizer = resizer.classList.contains('top');
		this.resizeListener = this.renderer.listen(window, 'mousemove', (ele: any) => {
			htmlContainer.style.zIndex = '10';
			if (!isTopResizer) {
				const height = this.original_height + (ele.pageY - this.original_mouse_y);
				if (height > this.minimum_size) {
					this.element.style.height = `${height}px`;
				}
			} else {
				const height = this.original_height - (ele.pageY - this.original_mouse_y);
				if (height > this.minimum_size && this.element.getBoundingClientRect().height !== height) {
					this.element.style.height = `${height}px`;
					this.element.style.top = `${this.original_y + (ele.pageY - this.original_mouse_y)}px`;
				}
			}
		});

		this.mouseUpEve = this.renderer.listen(window, 'mouseup', () => {
			htmlContainer.style.zIndex = '1';
			this.resizerMouseup(container, isTopResizer, appointment);
		});
	}

	private addMinutes(minutes: number, time: string): string {
		const date = new Date();
		const [hour, minute] = time.split(':');
		date.setHours(+hour);
		date.setMinutes(+minute);
		date.setSeconds(0);
		const subtractedDate = new Date(date.getTime() + minutes * 60 * 1000);
		return this.datePipe.transform(subtractedDate, 'HH:mm') ?? '';
	}

	private extendMinutesInBottom(appointment: Appointment): number {
		const appointmentEnd = DateTimeUtils.UTCTimeToLocalTimeString(appointment.endedAt.toString().split(' ')[1]).split(':');
		const calendarEnd = DateTimeUtils.UTCTimeToLocalTimeString(this.timeSlot?.intervals[this.timeSlot.intervals.length - 1].dayEnd).split(':');
		const appointmentEndInMin = DateTimeUtils.DurationInMinFromHour(+appointmentEnd[0], +appointmentEnd[1]);
		let calendarEndInMin = DateTimeUtils.DurationInMinFromHour(+calendarEnd[0], +calendarEnd[1]);
		calendarEndInMin = calendarEndInMin + 120 > 1440 ? 1440 : calendarEndInMin + 120;
		return calendarEndInMin - appointmentEndInMin;
	}

	private updateAppointmentDuration(
		appointment: Appointment,
		isExtend: boolean,
		container: HTMLDivElement,
		isTopResizer: boolean,
		minutes: number,
		divHieght: number,
		divTop: number,
	): void {
		const htmlContainer = container;
		let amountofMinutes = 0;
		if (isExtend && isTopResizer && divTop / this.pixelPerMinute < minutes) {
			amountofMinutes = divTop / this.pixelPerMinute;
		} else if (isExtend && !isTopResizer && this.minutesInBottom < +minutes) {
			amountofMinutes = this.minutesInBottom;
		} else {
			amountofMinutes = minutes;
		}

		const requestData = {
			amountofMinutes,
			extensionType: isExtend ? 'extend' : 'shorten',
			from: isTopResizer ? 'AtTheTop' : 'AtTheBottom',
			appointmentId: appointment.id,
			examId: appointment?.exams?.[0].id,
			roomId: appointment?.exams?.[0]?.rooms?.length ? appointment?.exams?.[0]?.rooms?.[0]?.id : null,
		} as UpdateDurationRequestData;

		container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		this.appointmentApiSvc.updateAppointmentDuration$(requestData).subscribe({
			next: () => {
				this.notificationSvc.showSuccess(Translate.AppointmentUpdatedSuccessfully[this.selectedLang]);
			},
			error: () => {
				if (container) {
					htmlContainer.style.top = `${divTop}px`;
					htmlContainer.style.height = `${divHieght}px`;
				}
			},
		});
	}

	private resizerMouseup(container: HTMLDivElement, isTopResizer: boolean, appointment: Appointment): void {
		const minutes = Math.round(Math.abs(parseInt(container?.style.height, 10) - this.original_height) / this.pixelPerMinute / 5) * 5;
		const isExtend = parseInt(container?.style.height, 10) > this.original_height;

		if (parseInt(container?.style.height, 10) !== this.original_height && minutes) {
			(async () => {
				if (this.compareGrayoutAreaWithAppointment(container, isExtend, isTopResizer)) {
					const confirmation = await this.showConfirm();
					if (confirmation) {
						this.updateAppointmentDuration(appointment, isExtend, container, isTopResizer, minutes, this.original_height, this.original_y);
					} else {
						this.element.style.height = `${this.original_height}px`;
						this.element.style.top = `${this.original_y}px`;
					}
				} else {
					this.updateAppointmentDuration(appointment, isExtend, container, isTopResizer, minutes, this.original_height, this.original_y);
				}
			})();
		} else {
			this.element.style.height = `${this.original_height}px`;
			this.element.style.top = `${this.original_y}px`;
		}
		this.resizeListener();
		this.resizeListener = () => {};
		this.mouseUpEve();
		this.mouseUpEve = () => {};
	}

	private showConfirm(): Promise<boolean> {
		return new Promise((resolve) => {
			const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
				data: {
					titleText: 'Confirmation',
					bodyText: `Are you sure you want to extend this appointment to outside hours?  Note: The involved staff members has to report early as per the start time.`,
					confirmButtonText: 'Yes',
					cancelButtonText: 'Cancel',
				},
			});
			modalRef.closed.pipe(take(1)).subscribe({
				next: (result) => resolve(result),
			});
		});
	}

	private compareGrayoutAreaWithAppointment(container: HTMLElement, isExtend: boolean, isTopResizer: boolean): boolean {
		if (isExtend && isTopResizer) {
			const top = parseInt(container.style.top, 10);
			const grayAreaSlots: Array<any> = [];
			this.grayOutSlot$$.value.forEach((slot) => {
				grayAreaSlots.push(`${+slot.top}-${+slot.top + +slot.height}`);
			});
			return grayAreaSlots.some((val: string) => {
				const topArray = val.split('-');
				if (+topArray[0] < top && +topArray[1] - 9 > top && !(+topArray[0] < this.original_y && +topArray[1] > this.original_y)) return true;
				return false;
			});
		}
		return false;
	}
}
