import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, filter, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { APPOINTMENT_ID, DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { Appointment } from '../../../../shared/models/appointment.model';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { Translate } from 'src/app/shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';

@Component({
	selector: 'dfm-view-appointment',
	templateUrl: './view-appointment.component.html',
	styleUrls: ['./view-appointment.component.scss'],
})
export class ViewAppointmentComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public appointment$$ = new BehaviorSubject<Appointment | undefined>(undefined);

	public rooms: string[] = [];

	public examDetails$$ = new BehaviorSubject<any[]>([]);

	public columns = ['Name', 'Expensive', 'Room', 'StartDate', 'EndDate'];

	private selectedLang: string = ENG_BE;

	public readonly Permission = Permission;

	public statuses = Statuses;

	constructor(
		private appointmentApiSvc: AppointmentApiService,
		private routerStateSvc: RouterStateService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private modalSvc: ModalService,
		private shareDataSvc: ShareDataService,
		private route: ActivatedRoute,
	) {
		super();
	}

	public ngOnInit(): void {
		this.route.params
			.pipe(
				filter((params) => params[APPOINTMENT_ID]),
				map((params) => params[APPOINTMENT_ID]),
				switchMap((appointmentID) => this.appointmentApiSvc.getAppointmentByID$(+appointmentID)),
				tap((appointment) => {
					this.appointment$$.next(appointment);
					this.examDetails$$.next(appointment?.exams ?? []);

					if (appointment?.exams?.length) {
						const roomIdToName: { [key: string]: string } = {};

						appointment.exams.forEach((exam) => {
							if (exam.rooms?.length) {
								exam?.rooms.forEach((room) => {
									if (!roomIdToName[room.id]) {
										roomIdToName[room.id] = room.name;
										this.rooms.push(room.name);
									}
								});
							}
						});
					}
				}),
				// switchMap((appointment) => {
				//   if (appointment && appointment.id) {
				//
				//   }
				// }),
				takeUntil(this.destroy$$),
			)
			.subscribe((appointment) => {});
		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe((lang) => {
				this.selectedLang = lang;
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
				this.router.navigate(['/', 'appointment'], { queryParamsHandling: 'merge', relativeTo: this.route });
			});
	}
}
