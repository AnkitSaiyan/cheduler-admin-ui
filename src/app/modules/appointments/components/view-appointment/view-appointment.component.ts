import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, filter, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { APPOINTMENT_ID, DUTCH_BE, ENG_BE, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { Appointment } from '../../../../shared/models/appointment.model';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { Translate } from 'src/app/shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { Permission } from 'src/app/shared/models/permission.model';
import { DocumentViewModalComponent } from 'src/app/shared/components/document-view-modal/document-view-modal.component';

@Component({
	selector: 'dfm-view-appointment',
	templateUrl: './view-appointment.component.html',
	styleUrls: ['./view-appointment.component.scss'],
})
export class ViewAppointmentComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public appointment$$ = new BehaviorSubject<Appointment | undefined>(undefined);

	public rooms: string[] = [];

	public examDetails$$ = new BehaviorSubject<any[]>([]);

	public absence$$ = new BehaviorSubject<any[]>([]);

	public columns = ['Name', 'Expensive', 'Room', 'StartDate', 'EndDate'];

	public absenceColumns = ['Title', 'StartDate', 'EndDate', 'AbsenceInfo'];


	private selectedLang: string = ENG_BE;

	public readonly Permission = Permission;

	public statuses = Statuses;

	public readonly previousPagefromView = localStorage.getItem('previousPagefromView') || 'appointment';

	constructor(
		private appointmentApiSvc: AppointmentApiService,
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
					this.absence$$.next(appointment?.absenceDetails ?? []);

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

	public openDocumentModal(id: number) {
		this.modalSvc.open(DocumentViewModalComponent, {
			data: {
				id,
			},
			options: {
				size: 'xl',
				backdrop: true,
				centered: true,
				modalDialogClass: 'ad-ap-modal-shadow',
			},
		});
	}

	public natigateToAbsence(e) {
		if (e?.id) {
			if(e.rooms?.length)
				this.router.navigate([`/absence/rooms/${e.id}/view`], { replaceUrl: true });
			else
				this.router.navigate([`/absence/staff/${e.id}/view`], { replaceUrl: true });	
		}
	}
}
