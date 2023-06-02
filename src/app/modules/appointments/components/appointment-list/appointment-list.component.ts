import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { NotificationType, TableItem } from 'diflexmo-angular-design';
import { BehaviorSubject, combineLatest, debounceTime, filter, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { PermissionService } from 'src/app/core/services/permission.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { JoinWithAndPipe } from 'src/app/shared/pipes/join-with-and.pipe';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { DownloadAsType, DownloadService } from '../../../../core/services/download.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NameValue, SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { Appointment } from '../../../../shared/models/appointment.model';
import { getDurationMinutes } from '../../../../shared/models/calendar.model';
import { Exam } from '../../../../shared/models/exam.model';
import { AppointmentStatus, AppointmentStatusToName, ChangeStatusRequestData } from '../../../../shared/models/status.model';
import { Translate } from '../../../../shared/models/translate.model';
import { DefaultDatePipe } from '../../../../shared/pipes/default-date.pipe';
import { DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { getAppointmentStatusEnum, getReadStatusEnum } from '../../../../shared/utils/getEnums';

@Component({
	selector: 'dfm-appointment-list',
	templateUrl: './appointment-list.component.html',
	styleUrls: ['./appointment-list.component.scss'],
})
export class AppointmentListComponent extends DestroyableComponent implements OnInit, OnDestroy {
	@HostListener('document:click', ['$event']) onClick() {
		this.toggleMenu(true);
	}

	public searchControl = new FormControl('', []);

	public downloadDropdownControl = new FormControl('', []);

	public columns: string[] = ['StartedAt', 'EndedAt', 'PatientName', 'Exams', 'Physician', 'AppointmentNo', 'AppliedOn', 'Status', 'Actions'];

	public downloadItems: NameValue[] = [];

	public appointments$$: BehaviorSubject<any[]>;

	public filteredAppointments$$: BehaviorSubject<any[]>;

	public appointmentsGroupedByDate: { [key: string]: Appointment[] } = {};

	public appointmentsGroupedByDateAndTime: { [keydeployed: string]: Appointment[][] } = {};

	private selectedLang: string = ENG_BE;

	public statuses = Statuses;

	public readonly Permission = Permission;

	public appointmentGroupedByDateAndRoom: {
		[key: string]: {
			[key: number]: {
				appointment: Appointment;
				exams: Exam[];
			}[];
		};
	} = {};

	public clearSelected$$ = new Subject<void>();

	public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: AppointmentStatus | null } | null>(null);

	public calendarView$$ = new BehaviorSubject<boolean>(false);

	public selectedAppointmentIDs: string[] = [];

	public roomList: NameValue[] = [];

	public statusType = getAppointmentStatusEnum();

	public readStatus = getReadStatusEnum();

	public clipboardData: string = '';

	constructor(
		private downloadSvc: DownloadService,
		private appointmentApiSvc: AppointmentApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private route: ActivatedRoute,
		private modalSvc: ModalService,
		private roomApiSvc: RoomsApiService,
		private datePipe: DatePipe,
		private cdr: ChangeDetectorRef,
		private titleCasePipe: TitleCasePipe,
		private routerStateSvc: RouterStateService,
		private shareDataSvc: ShareDataService,
		private translate: TranslateService,
		public permissionSvc: PermissionService,
		private defaultDatePipe: DefaultDatePipe,
		private utcToLocalPipe: UtcToLocalPipe,
		private joinWithAndPipe: JoinWithAndPipe,
		private translatePipe: TranslatePipe,
	) {
		super();
		this.appointments$$ = new BehaviorSubject<any[]>([]);
		this.filteredAppointments$$ = new BehaviorSubject<any[]>([]);

		this.route.queryParams.pipe(takeUntil(this.destroy$$)).subscribe((params) => {
			if (params['v']) {
				this.calendarView$$.next(params['v'] !== 't');
			} else {
				this.router.navigate([], {
					replaceUrl: true,
					queryParams: {
						v: 'w',
					},
				});
				this.calendarView$$.next(true);
			}
		});
	}

	public ngOnInit() {
		this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

		this.appointmentApiSvc.appointment$.pipe(takeUntil(this.destroy$$)).subscribe((appointments) => {
			this.appointments$$.next(appointments);
			this.filteredAppointments$$.next(appointments);

			// appointments.sort((ap1, ap2) => new Date(ap1?.startedAt).getTime() - new Date(ap2?.startedAt).getTime());
			//
			//
			//
			// this.groupAppointmentsForCalendar(...appointments);
			// this.groupAppointmentByDateAndRoom(...appointments);
			//
			//
		});

		this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe((searchText) => {
			if (searchText) {
				this.handleSearch(searchText.toLowerCase());
			} else {
				this.filteredAppointments$$.next([...this.appointments$$.value]);
			}
		});

		this.downloadDropdownControl.valueChanges
			.pipe(
				filter((value) => !!value),
				takeUntil(this.destroy$$),
			)
			.subscribe((value) => {

				if (!this.filteredAppointments$$.value.length) {
					this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
					this.clearDownloadDropdown();
					return;
				}

				this.downloadSvc.downloadJsonAs(
					value as DownloadAsType,
					this.columns.slice(0, -1),
					this.filteredAppointments$$.value?.map((ap: Appointment) => [
						this.defaultDatePipe.transform(this.utcToLocalPipe.transform(ap?.startedAt?.toString())) ?? '',
						this.defaultDatePipe.transform(this.utcToLocalPipe.transform(ap?.endedAt?.toString())) ?? '',
						`${this.titleCasePipe.transform(ap?.patientFname)} ${this.titleCasePipe.transform(ap?.patientLname)}`,
						this.joinWithAndPipe.transform(ap.exams, 'name'),
						this.titleCasePipe.transform(ap?.doctor),
						ap?.id?.toString(),
						ap?.createdAt?.toString(),
						// ap.readStatus ? 'Yes' : 'No',
						this.translatePipe.transform(AppointmentStatusToName[+ap.approval]),
					]),
					'appointment',
				);

				if (value !== 'PRINT') {
					this.notificationSvc.showNotification(`${Translate.DownloadSuccess(value)[this.selectedLang]}`);
				}
				this.clearDownloadDropdown();
			});

		this.afterBannerClosed$$
			.pipe(
				map((value) => {
					if (value?.proceed) {
						return [...this.selectedAppointmentIDs.map((id) => ({ id: +id, status: value.newStatus as number }))];
					}
					return [];
				}),
				filter((changes) => {
					if (!changes.length) {
						this.clearSelected$$.next();
					}
					return !!changes.length;
				}),
				switchMap((changes) => this.appointmentApiSvc.changeAppointmentStatus$(changes)),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: () => {
					this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]);
					this.clearSelected$$.next();
				},
			});

		this.roomApiSvc.allRooms$.pipe(takeUntil(this.destroy$$)).subscribe((rooms) => {
			this.roomList = rooms?.map(({ name, id }) => ({ name, value: id }));
		});

		combineLatest([this.shareDataSvc.getLanguage$(), this.permissionSvc.permissionType$])
			.pipe(takeUntil(this.destroy$$))
			.subscribe(([lang]) => {
				this.selectedLang = lang;
				this.columns = [
					Translate.StartedAt[lang],
					Translate.EndedAt[lang],
					Translate.PatientName[lang],
					Translate.Exam[lang],
					Translate.Physician[lang],
					Translate.AppointmentNo[lang],
					Translate.AppliedOn[lang],
					// Translate.Read[lang],
					Translate.Status[lang],
				];

				if (this.permissionSvc.isPermitted([Permission.UpdateAppointments, Permission.DeleteAppointments])) {
					this.columns = [...this.columns, Translate.Actions[lang]];
				}

				// eslint-disable-next-line default-case
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
		super.ngOnDestroy();
	}

	public handleCheckboxSelection(selected: string[]) {
		// this.toggleMenu(true);

		this.selectedAppointmentIDs = [...selected];
	}

	private handleSearch(searchText: string): void {
		this.filteredAppointments$$.next([
			...this.appointments$$.value.filter((appointment) => {
				let status: any;
				if (appointment.approval === 0) status = this.translate.instant('Pending');
				if (appointment.approval === 1) status = this.translate.instant('Approved');
				if (appointment.approval === 2) status = this.translate.instant('Canceled');
				return (
					appointment.patientFname?.toLowerCase()?.includes(searchText) ||
					appointment.patientLname?.toLowerCase()?.includes(searchText) ||
					appointment.doctor?.toLowerCase()?.includes(searchText) ||
					appointment.id?.toString()?.includes(searchText) ||
					status?.toLowerCase()?.startsWith(searchText)
				);
			}),
		]);
	}

	public changeStatus(changes: ChangeStatusRequestData[]) {
		this.appointmentApiSvc
			.changeAppointmentStatus$(changes)
			.pipe(takeUntil(this.destroy$$))
			.subscribe(() => this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang]));
	}

	public deleteAppointment(id: number) {
		const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreYouSureYouWantToDeleteAppointment',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		dialogRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => this.appointmentApiSvc.deleteAppointment$(id)),
				take(1),
			)
			.subscribe(() => {
				this.notificationSvc.showNotification(Translate.DeleteAppointment[this.selectedLang]);
			});
	}

	public handleConfirmation(e: { proceed: boolean; newStatus: AppointmentStatus | null }) {
		this.afterBannerClosed$$.next(e);
	}

	public copyToClipboard() {
		try {
			let dataString = `Started At\t\t\tEnded At\t\t\t`;
			dataString += `${this.columns.slice(2, -1).join('\t\t')}\n`;

			this.filteredAppointments$$.value.forEach((ap: Appointment) => {
				dataString += `${ap.startedAt.toString()}\t${ap.endedAt.toString()}\t${this.titleCasePipe.transform(
					ap.patientFname,
				)} ${this.titleCasePipe.transform(ap.patientLname)}\t\t${this.titleCasePipe.transform(
					ap.doctor,
				)}\t\t${ap.id.toString()}\t\t${ap.createdAt.toString()}\t\t${ap.readStatus ? 'Yes' : 'No'}\t\t${AppointmentStatusToName[+ap.approval]}\n`;
			});

			this.clipboardData = dataString;

			this.cdr.detectChanges();
			this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
		} catch (e) {
			this.notificationSvc.showNotification(Translate.ErrorMessage.FailedToCopyData[this.selectedLang], NotificationType.DANGER);
			this.clipboardData = '';
		}
	}

	public navigateToView(e: TableItem) {
		if (e?.id) {
			this.router.navigate([`./${e.id}/view`], { replaceUrl: true, relativeTo: this.route });
		}
	}

	public toggleMenu(reset = false) {
		const icon = document.querySelector('.sf-li-plus-btn-icon');
		if (icon) {
			if (reset) {
				icon.classList.add('rotate-z-0');
				icon.classList.remove('rotate-z-45');
			} else {
				icon.classList.toggle('rotate-z-45');
				icon.classList.toggle('rotate-z-0');
			}
		}
	}

	public openSearchModal() {
		this.toggleMenu();

		const modalRef = this.modalSvc.open(SearchModalComponent, {
			options: { fullscreen: true },
			data: {
				items: [
					...this.appointments$$.value.map(({ id, patientLname, patientFname }) => {
						return {
							name: `${patientFname} ${patientLname}`,
							key: `${patientFname} ${patientLname} ${id}`,
							value: id,
						};
					}),
				],
				placeHolder: 'Search by Patient Name, app. no...',
			} as SearchModalData,
		});

		modalRef.closed.pipe(take(1)).subscribe((result) => this.filterAppointments(result));
	}

	private filterAppointments(result: { name: string; value: string }[]) {
		if (!result?.length) {
			this.filteredAppointments$$.next([...this.appointments$$.value]);
			return;
		}

		const ids = new Set<number>();
		result.forEach((item) => ids.add(+item.value));
		this.filteredAppointments$$.next([...this.appointments$$.value.filter((appointment: Appointment) => ids.has(+appointment.id))]);
	}

	public toggleView(): void {
		this.router.navigate([], {
			replaceUrl: true,
			queryParams: {
				v: !this.calendarView$$.value ? 'w' : 't',
			},
		});
	}

	private groupAppointmentsForCalendar(...appointments: Appointment[]) {
		let startDate: Date;
		let endDate: Date;
		// let group: number;
		let sameGroup: boolean;
		let groupedAppointments: Appointment[] = [];
		let lastDateString: string;

		this.appointmentsGroupedByDate = {};
		this.appointmentsGroupedByDateAndTime = {};
		this.appointmentGroupedByDateAndRoom = {};

		appointments.push({} as Appointment);
		appointments.forEach((appointment, index) => {
			if (Object.keys(appointment).length && appointment.exams?.length && appointment.startedAt) {
				const dateString = this.datePipe.transform(new Date(appointment.startedAt), 'd-M-yyyy');

				if (dateString) {
					if (!this.appointmentsGroupedByDate[dateString]) {
						this.appointmentsGroupedByDate[dateString] = [];
					}

					if (!this.appointmentsGroupedByDateAndTime[dateString]) {
						this.appointmentsGroupedByDateAndTime[dateString] = [];

						startDate = new Date(appointment.startedAt);
						endDate = new Date(appointment.endedAt);
						// group = 0;
						sameGroup = false;
					} else {
						const currSD = new Date(appointment.startedAt);
						const currED = new Date(appointment.endedAt);

						if (currSD.getTime() === startDate.getTime() || (currSD > startDate && currSD < endDate) || currSD.getTime() === endDate.getTime()) {
							sameGroup = true;
							if (currED > endDate) {
								endDate = currED;
							}
						} else if (currSD > endDate && getDurationMinutes(endDate, currSD) <= 1) {
							sameGroup = true;
							if (currED > endDate) {
								endDate = currED;
							}
						} else {
							startDate = currSD;
							endDate = currED;
							sameGroup = false;
						}
					}

					if (!sameGroup) {
						// group++;

						if (index !== 0) {
							this.appointmentsGroupedByDateAndTime[lastDateString].push(groupedAppointments);
							groupedAppointments = [];
						}
					}

					lastDateString = dateString;

					groupedAppointments.push(appointment);
					this.appointmentsGroupedByDate[dateString].push(appointment);
				}
			} else if (lastDateString) {
				this.appointmentsGroupedByDateAndTime[lastDateString].push(groupedAppointments);
			}
		});
	}

	private groupAppointmentByDateAndRoom(...appointments: Appointment[]) {
		// const groupBy: {
		//   [key: string]: {
		//     [key: number]: {
		//       appointment: Appointment;
		//       exam: Exam[];
		//     };
		//   };
		// } = {};

		appointments.forEach((appointment) => {
			const dateString = this.datePipe.transform(new Date(appointment.startedAt), 'd-M-yyyy');

			if (dateString) {
				if (!this.appointmentGroupedByDateAndRoom[dateString]) {
					this.appointmentGroupedByDateAndRoom[dateString] = {};
				}

				appointment.exams?.forEach((exam) => {
					exam.rooms?.forEach((room) => {
						if (!this.appointmentGroupedByDateAndRoom[dateString][room.id]) {
							this.appointmentGroupedByDateAndRoom[dateString][room.id] = [];
						}

						this.appointmentGroupedByDateAndRoom[dateString][room.id].push({
							appointment,
							exams: appointment.exams ?? [],
						});
					});
				});
			}
		});
	}

	private clearDownloadDropdown() {
		setTimeout(() => {
			this.downloadDropdownControl.setValue('');
		}, 0);
	}

	public onRefresh(): void {
		this.appointmentApiSvc.refresh();
	}
}
