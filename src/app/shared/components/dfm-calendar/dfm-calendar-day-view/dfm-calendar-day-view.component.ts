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
import { BehaviorSubject, filter, firstValueFrom, lastValueFrom, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { DatePipe } from '@angular/common';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { NotificationType } from 'diflexmo-angular-design';
import { NameValue } from '../../search-modal.component';
import {
	AddAppointmentRequestData,
	Appointment,
	AppointmentSlotsRequestData,
	UpdateDurationRequestData,
	UpdateRadiologistRequestData,
} from '../../../models/appointment.model';
import { Exam } from '../../../models/exam.model';
import { CalenderTimeSlot, getDurationMinutes, Interval } from '../../../models/calendar.model';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../confirm-action-modal.component';
import { ChangeRadiologistModalComponent } from '../../../../modules/appointments/components/change-radiologist-modal/change-radiologist-modal.component';
import { AppointmentTimeChangeModalComponent } from '../../../../modules/appointments/components/appointment-time-change-modal/appointment-time-change-modal.component';
import { ShareDataService } from '../../../../core/services/share-data.service';
import { getAddAppointmentRequestData } from '../../../utils/getAddAppointmentRequestData';
import { ReadStatus } from '../../../models/status.model';
import { AddAppointmentModalComponent } from '../../../../modules/appointments/components/add-appointment-modal/add-appointment-modal.component';
import { Translate } from '../../../models/translate.model';
import { CalendarType, ENG_BE } from 'src/app/shared/utils/const';
import { DestroyableComponent } from '../../destroyable.component';
import { PermissionService } from 'src/app/core/services/permission.service';
import { UserRoleEnum } from 'src/app/shared/models/user.model';
import { DateTimeUtils } from 'src/app/shared/utils/date-time.utils';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DraggableService } from 'src/app/core/services/draggable.service';
import { ActivatedRoute } from '@angular/router';

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
	public timeSlot!: CalenderTimeSlot;
	@Input()
	public dataGroupedByDateAndRoom!: {
		[key: string]: {
			[key: number]: {
				appointment: Appointment;
				exams: Exam[];
			}[];
		};
	};
	@Input()
	public format24Hour = false;
	@Output()
	public selectedDateEvent = new EventEmitter<Date>();
	@Output()
	public deleteAppointmentEvent = new EventEmitter<number>();
	public calendarType = CalendarType;
	public selectedDate!: Date;
	public selectedDateOnly!: number;
	public todayDate = new Date();
	public dateString!: string;
	public readonly timeInterval: number = 15;
	public readonly pixelsPerMin: number = 4;
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
	public hideAppointmentData = {};
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
		private draggableSvc: DraggableService,
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute,
	) {
		super();
		this.route.queryParams
			.pipe(
				filter(({ d }) => !!d),
				takeUntil(this.destroy$$),
			)
			.subscribe(({ d }) => {
				const date = d.split('-');
				this.selectedDate = new Date(date?.[0], date?.[1] - 1, date?.[2], 0, 0, 0, 0);
			});
	}

	public ngOnChanges(changes: SimpleChanges) {
		if (!this.selectedDate) {
			this.updateDate(new Date());
		}

		const currentValue = changes['dataGroupedByDateAndRoom']?.currentValue;
		const previousValue = changes['dataGroupedByDateAndRoom']?.previousValue;
		if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
			this.dataGroupedByDateAndRoom = currentValue;
		}

		this.grayOutSlot$$.next([]);
		this.getGrayOutArea(this.timeSlot);
		const date: string = this.datePipe.transform(this.selectedDate, 'd-M-yyyy')!;
		this.hideAppointmentData = {};
		if (this.dataGroupedByDateAndRoom[date]) {
			Object.values(this.dataGroupedByDateAndRoom[date]).forEach((data) => {
				this.getTop([data?.[0].appointment], true);
			});
		}
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
			.pipe()
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
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public getHeight(groupedData: any[]): number {
		let endDate: Date = groupedData[0].endedAt;

		groupedData.forEach((data) => {
			if (data.endedAt > endDate) {
				endDate = data.endedAt;
			}
		});

		// debugger;
		const durationMinutes = getDurationMinutes(groupedData[0].startedAt, endDate);
		return durationMinutes * this.pixelsPerMin;
	}

	public getTop(groupedData: any[], storeHiddenAppointment: boolean = false): number {
		// const startHour = new Date(groupedData[0].startedAt).getHours();
		// const startMinute = new Date(groupedData[0].startedAt).getMinutes();
		// const barHeight = 1;
		// const horizontalBarHeight = (this.getHeight(groupedData) / (this.pixelsPerMin * this.timeInterval)) * barHeight;
		// const top = (startMinute + startHour * 60) * this.pixelsPerMin - horizontalBarHeight;
		const start = this.myDate(this.timeSlot?.timings?.[0]);
		start.setFullYear(this.selectedDate.getFullYear());
		start.setMonth(this.selectedDate.getMonth());
		start.setDate(this.selectedDate.getDate());
		const end = new Date(groupedData[0].startedAt);
		if (start.getTime() > end.getTime()) {
			if (storeHiddenAppointment) {
				if (this.hideAppointmentData[groupedData?.[0]?.roomsDetail?.[0]?.name]) {
					this.hideAppointmentData[groupedData?.[0]?.roomsDetail?.[0]?.name] = [
						...this.hideAppointmentData[groupedData?.[0]?.roomsDetail?.[0]?.name],
						groupedData?.[0],
					];
				}
				this.hideAppointmentData[groupedData?.[0]?.roomsDetail?.[0]?.name] = [groupedData?.[0]];
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
					const requestData = {
						appointmentId: appointment.id,
						examId: appointment.exams[0].id,
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

	public openChangeTimeModal(
		appointment: Appointment,
		extend = true,
		eventContainer: HTMLDivElement,
		position?: boolean,
		time?: number,
		divHieght?: number,
		divTop?: number,
	) {
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
			eventContainer.style.top = divTop + 'px';
			eventContainer.style.height = divHieght + 'px';
		}

		modalRef.closed
			.pipe(
				filter((res) => !!res),
				switchMap((res) => {
					// Handled at backend will be removed once verified
					// const startedAt = new Date(appointment.startedAt);
					// const endedAt = new Date(appointment.endedAt);
					// const hour = Math.floor(+res.minutes / 60);
					// const min = +res.minutes % 60;
					//
					// if (res.top) {
					//   startedAt.setMinutes(startedAt.getMinutes() + min * (extend ? -1 : 1));
					//   if (hour) {
					//     startedAt.setHours(startedAt.getHours() + hour * (extend ? -1 : 1));
					//   }
					// } else {
					//   endedAt.setMinutes(endedAt.getMinutes() + min * (extend ? 1 : -1));
					//   if (hour) {
					//     endedAt.setHours(endedAt.getHours() + hour * (extend ? 1 : -1));
					//   }
					// }

					const requestData = {
						amountofMinutes: +res.minutes,
						extensionType: extend ? 'extend' : 'shorten',
						from: res.top ? 'AtTheTop' : 'AtTheBottom',
						appointmentId: appointment.id,
						examId: appointment.exams[0].id,
						roomId: appointment.exams[0]?.rooms?.length ? appointment.exams[0]?.rooms[0]?.id : null,
					} as UpdateDurationRequestData;

					eventContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
					return this.appointmentApiSvc.updateAppointmentDuration$(requestData);
				}),
				take(1),
			)
			.subscribe({
				next: (res) => {
					this.notificationSvc.showSuccess(Translate.AppointmentUpdatedSuccessfully[this.selectedLang]);
				},
				error: (err) => {
					// this.notificationSvc.showNotification(Translate.Error.SomethingWrong[this.selectedLang], NotificationType.DANGER);
					if (eventContainer) {
						// eslint-disable-next-line no-param-reassign
						eventContainer.style.top = divTop ? divTop + 'px' : top;
						// eslint-disable-next-line no-param-reassign
						eventContainer.style.height = divHieght ? divHieght + 'px' : height;
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
				next: (res) => this.notificationSvc.showNotification(`${Translate.SuccessMessage.Deleted[this.selectedLang]}!`),
			});
	}

	public async addAppointment(e: MouseEvent, eventsContainer?: HTMLDivElement, appointment?: Appointment) {
		if (this.permissionSvc.permissionType === UserRoleEnum.Reader) return;
		const currentDate = new Date();

		let minutes = Math.round(+e?.offsetY / this.pixelPerMinute);

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
				date: date,
				exams: appointment.exams.map(({ id }) => id + ''),
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
		// const textNode = document.createTextNode('Appointment');

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
		const timeDuration = getDurationMinutes(this.myDate(timings?.[0]), this.myDate(intervals?.[0].dayStart));
		grayOutSlot.push({
			dayStart: timings?.[0],
			dayEnd: timings?.[0],
			top: 0,
			height: (timeDuration > 120 ? 120 : timeDuration) * this.pixelsPerMin,
		});
		const dayStart = intervals[intervals.length - 1].dayEnd;
		const startTime = this.myDate(this.timeSlot?.timings?.[0]);
		const dayStartTime = this.myDate(dayStart);
		const lastMinutes = getDurationMinutes(startTime, dayStartTime);
		const dayEnd = this.addMinutes(15, timings[timings?.length - 1]);

		grayOutSlot.push({
			dayStart: intervals[intervals.length - 1].dayEnd,
			dayEnd,
			top: lastMinutes * this.pixelsPerMin,
			height: getDurationMinutes(dayStartTime, this.myDate(dayEnd)) * this.pixelsPerMin,
		});

		if (intervals?.length > 1) {
			for (let i = 0; i < intervals.length - 1; i++) {
				const start = this.myDate(this.timeSlot?.timings?.[0]);
				const end = this.myDate(intervals[i].dayEnd);
				const minutes = getDurationMinutes(start, end);
				const timeInterval = getDurationMinutes(end, this.myDate(intervals[i + 1].dayStart));
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

	private myDate(date: string): Date {
		const formattedDate = new Date();
		const splitDate = date.split(':');
		formattedDate.setHours(+splitDate[0]);
		formattedDate.setMinutes(+splitDate[1]);
		formattedDate.setSeconds(0);
		return formattedDate;
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

	public resize(e: any, resizer: HTMLDivElement, appointment: Appointment, container: HTMLDivElement) {
		this.minutesInBottom = this.extendMinutesInBottom(appointment);
		this.element = container;
		this.currentResizer = resizer;
		e.preventDefault();
		this.original_height = parseInt(container?.style.height);
		this.original_y = parseInt(container?.style.top);
		this.original_mouse_y = e.pageY;
		const isTopResizer = resizer.classList.contains('top');
		let resizeListener = this.renderer.listen(window, 'mousemove', (e: any) => {
			if (!isTopResizer) {
				const height = this.original_height + (e.pageY - this.original_mouse_y);
				if (height > this.minimum_size) {
					this.element.style.height = height + 'px';
				}
			} else if (isTopResizer) {
				const height = this.original_height - (e.pageY - this.original_mouse_y);
				if (height > this.minimum_size && this.element.getBoundingClientRect().height != height) {
					this.element.style.height = height + 'px';
					this.element.style.top = this.original_y + (e.pageY - this.original_mouse_y) + 'px';
				}
			}
		});

		let mouseUpEve = this.renderer.listen(window, 'mouseup', () => {
			const minutes = Math.round(Math.abs(parseInt(container?.style.height) - this.original_height) / this.pixelPerMinute / 5) * 5;
			const isExtend = parseInt(container?.style.height) > this.original_height;

			if (parseInt(container?.style.height) != this.original_height && minutes) {
				// this.openChangeTimeModal(appointment, isExtend, container, isTopResizer, minutes, this.original_height, this.original_y);
				this.updateAppointmentDuration(appointment, isExtend, container, isTopResizer, minutes, this.original_height, this.original_y);
			} else {
				this.element.style.height = this.original_height + 'px';
				this.element.style.top = this.original_y + 'px';
			}
			resizeListener();
			resizeListener = () => {};
			mouseUpEve();
			mouseUpEve = () => {};
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

	private updateAppointmentDuration(appointment, isExtend, container, isTopResizer, minutes, divHieght, divTop) {
		let amountofMinutes =
			isExtend && isTopResizer && divTop / this.pixelPerMinute < minutes
				? divTop / this.pixelPerMinute
				: isExtend && !isTopResizer && this.minutesInBottom < +minutes
				? this.minutesInBottom
				: minutes;

		const requestData = {
			amountofMinutes,
			extensionType: isExtend ? 'extend' : 'shorten',
			from: isTopResizer ? 'AtTheTop' : 'AtTheBottom',
			appointmentId: appointment.id,
			examId: appointment.exams[0].id,
			roomId: appointment.exams[0]?.rooms?.length ? appointment.exams[0]?.rooms[0]?.id : null,
		} as UpdateDurationRequestData;

		container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		return this.appointmentApiSvc.updateAppointmentDuration$(requestData).subscribe({
			next: (res) => {
				this.notificationSvc.showSuccess(Translate.AppointmentUpdatedSuccessfully[this.selectedLang]);
			},
			error: (err) => {
				if (container) {
					container.style.top = divTop + 'px';
					container.style.height = divHieght + 'px';
				}
			},
		});
	}
}
