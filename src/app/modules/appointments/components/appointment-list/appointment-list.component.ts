import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TableItem } from 'diflexmo-angular-design';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { AppointmentStatus, Status } from '../../../../shared/models/status';
import { getAppointmentStatusEnum, getReadStatusEnum } from '../../../../shared/utils/getStatusEnum';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ConfirmActionModalComponent, DialogData } from '../../../../shared/components/confirm-action-modal.component';
import { NameValue, SearchModalComponent, SearchModalData } from '../../../../shared/components/search-modal.component';
import { DownloadService } from '../../../../core/services/download.service';
import { AppointmentApiService } from '../../../../core/services/appointment-api.service';
import { Appointment } from '../../../../shared/models/appointment.model';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';

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

  public columns: string[] = ['Started At', 'Ended At', 'Patient Name', 'Doctor', 'Appointment No', 'Applied On', 'Read', 'Status', 'Actions'];

  public downloadItems: NameValue[] = [];

  private appointments$$: BehaviorSubject<any[]>;

  public filteredAppointments$$: BehaviorSubject<any[]>;

  public clearSelected$$ = new Subject<void>();

  public afterBannerClosed$$ = new BehaviorSubject<{ proceed: boolean; newStatus: AppointmentStatus | null } | null>(null);

  public calendarView$$ = new BehaviorSubject<boolean>(true);

  public selectedAppointmentIDs: string[] = [];

  public roomList: NameValue[] = [];

  public statusType = getAppointmentStatusEnum();

  public readStatus = getReadStatusEnum();

  constructor(
    private downloadSvc: DownloadService,
    private appointmentApiSvc: AppointmentApiService,
    private notificationSvc: NotificationDataService,
    private router: Router,
    private route: ActivatedRoute,
    private modalSvc: ModalService,
    private roomApiSvc: RoomsApiService,
  ) {
    super();
    this.appointments$$ = new BehaviorSubject<any[]>([]);
    this.filteredAppointments$$ = new BehaviorSubject<any[]>([]);
  }

  public ngOnInit(): void {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe((items) => (this.downloadItems = items));

    this.appointmentApiSvc.appointment$.pipe(takeUntil(this.destroy$$)).subscribe((appointments) => {
      this.appointments$$.next(appointments);
      this.filteredAppointments$$.next(appointments);
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
        switch (value) {
          case 'print':
            this.notificationSvc.showNotification(`Data printed successfully`);
            break;
          default:
            this.notificationSvc.showNotification(`Download in ${value?.toUpperCase()} successfully`);
        }
      });

    this.afterBannerClosed$$
      .pipe(
        map((value) => {
          if (value?.proceed) {
            return [...this.selectedAppointmentIDs.map((id) => ({ id: +id, newStatus: value.newStatus }))];
          }

          return [];
        }),
        switchMap((changes) => this.appointmentApiSvc.changeAppointmentStatus$(changes)),
        takeUntil(this.destroy$$),
      )
      .subscribe((value) => {
        if (value) {
          this.notificationSvc.showNotification('Status has changed successfully');
        }
        this.clearSelected$$.next();
      });

    this.roomApiSvc.rooms$.pipe(takeUntil(this.destroy$$)).subscribe((rooms) => {
      this.roomList = rooms.map(({ name, id }) => ({ name, value: id }));
    });
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  public handleCheckboxSelection(selected: string[]) {
    this.toggleMenu(true);
    this.selectedAppointmentIDs = [...selected];
  }

  private handleSearch(searchText: string): void {
    this.filteredAppointments$$.next([
      ...this.appointments$$.value.filter((appointment) => {
        return (
          appointment.patientFname?.toLowerCase()?.includes(searchText) ||
          appointment.patientLname?.toLowerCase()?.includes(searchText) ||
          appointment.id?.toString()?.includes(searchText)
        );
      }),
    ]);
  }

  public changeStatus(changes: { id: number | string; newStatus: AppointmentStatus | null }[]) {
    this.appointmentApiSvc
      .changeAppointmentStatus$(changes)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => this.notificationSvc.showNotification('Status has changed successfully'));
  }

  public deleteAppointment(id: number) {
    const dialogRef = this.modalSvc.open(ConfirmActionModalComponent, {
      data: {
        titleText: 'Confirmation',
        bodyText: 'Are you sure you want to delete this Appointment?',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      } as DialogData,
    });

    dialogRef.closed
      .pipe(
        filter((res: boolean) => res),
        take(1),
      )
      .subscribe(() => {
        this.appointmentApiSvc.deleteAppointment(id);
        this.notificationSvc.showNotification('Appointment deleted successfully');
      });
  }

  public handleConfirmation(e: { proceed: boolean; newStatus: AppointmentStatus | null }) {
    console.log(e);
    this.afterBannerClosed$$.next(e);
  }

  public copyToClipboard() {
    this.notificationSvc.showNotification('Data copied to clipboard successfully');
  }

  public navigateToView(e: TableItem) {
    if (e?.id) {
      console.log('in');
      this.router.navigate([`./${e.id}/view`], { relativeTo: this.route });
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
    console.log(result, this.appointments$$.value);
    if (!result?.length) {
      this.filteredAppointments$$.next([...this.appointments$$.value]);
      return;
    }

    const ids = new Set<number>();
    result.forEach((item) => ids.add(+item.value));
    this.filteredAppointments$$.next([...this.appointments$$.value.filter((appointment: Appointment) => ids.has(+appointment.id))]);
  }

  public toggleView(): void {
    this.calendarView$$.next(!this.calendarView$$.value);
  }
}
