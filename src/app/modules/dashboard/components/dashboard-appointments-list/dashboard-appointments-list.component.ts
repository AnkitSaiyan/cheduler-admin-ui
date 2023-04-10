import {ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {BehaviorSubject, combineLatest, debounceTime, filter, map, Subject, switchMap, take, takeUntil} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {NotificationType, TableItem} from 'diflexmo-angular-design';
import {DatePipe, TitleCasePipe} from '@angular/common';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {
  AppointmentStatus,
  AppointmentStatusToName,
  ChangeStatusRequestData
} from '../../../../shared/models/status.model';
import {getAppointmentStatusEnum, getReadStatusEnum} from '../../../../shared/utils/getEnums';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {ModalService} from '../../../../core/services/modal.service';
import {
  ConfirmActionModalComponent,
  ConfirmActionModalData
} from '../../../../shared/components/confirm-action-modal.component';
import {NameValue, SearchModalComponent, SearchModalData} from '../../../../shared/components/search-modal.component';
import {DownloadAsType, DownloadService} from '../../../../core/services/download.service';
import {AppointmentApiService} from '../../../../core/services/appointment-api.service';
import {Appointment} from '../../../../shared/models/appointment.model';
import {RoomsApiService} from '../../../../core/services/rooms-api.service';
import {Exam} from '../../../../shared/models/exam.model';
import {DUTCH_BE, ENG_BE, Statuses, StatusesNL} from '../../../../shared/utils/const';
import {Translate} from '../../../../shared/models/translate.model';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {RouterStateService} from '../../../../core/services/router-state.service';
import {AppointmentAdvanceSearchComponent} from './appointment-advance-search/appointment-advance-search.component';
import {TranslateService} from '@ngx-translate/core';
import {PermissionService} from 'src/app/core/services/permission.service';
import {UserRoleEnum} from 'src/app/shared/models/user.model';
import {Permission} from 'src/app/shared/models/permission.model';

@Component({
  selector: 'dfm-dashboard-appointments-list',
  templateUrl: './dashboard-appointments-list.component.html',
  styleUrls: ['./dashboard-appointments-list.component.scss'],
})
export class DashboardAppointmentsListComponent extends DestroyableComponent implements OnInit, OnDestroy {
  @HostListener('document:click', ['$event']) onClick() {
    this.toggleMenu(true);
  }

  public searchControl = new FormControl('', []);

  public downloadDropdownControl = new FormControl('', []);

  public columns: string[] = ['StartedAt', 'EndedAt', 'PatientName', 'Physician', 'AppointmentNo', 'AppliedOn', 'Status'];

  public downloadItems: NameValue[] = [];

  private appointments$$: BehaviorSubject<any[]>;

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
  ) {
    super();
    this.appointments$$ = new BehaviorSubject<any[]>([]);
    this.filteredAppointments$$ = new BehaviorSubject<any[]>([]);

    // this.routerStateSvc
    //   .listenForQueryParamsChanges$()
    //   .pipe(debounceTime(100))
    //   .subscribe({
    //     next: (params) => {
    //       if (params['v']) {
    //         this.calendarView$$.next(params['v'] !== 't');
    //       } else {
    //         this.router.navigate([], {
    //           replaceUrl: true,
    //           queryParams: {
    //             v: 'w',
    //           },
    //         });
    //         this.calendarView$$.next(true);
    //       }
    //     }
    //   });
  }

  public ngOnInit() {
    this.downloadSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: (items) => (this.downloadItems = items)
    });

    this.appointmentApiSvc.appointment$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: (appointments) => {
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
      }
    });

    this.searchControl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$$)).subscribe({
      next: (searchText) => {
        if (searchText) {
          this.handleSearch(searchText.toLowerCase());
        } else {
          this.filteredAppointments$$.next([...this.appointments$$.value]);
        }
      }
    });

    this.downloadDropdownControl.valueChanges
      .pipe(
        filter((value) => !!value),
        takeUntil(this.destroy$$),
      )
      .subscribe({
        next: (value) => {
          if (!this.filteredAppointments$$.value.length) {
            this.notificationSvc.showNotification(Translate.NoDataToDownlaod[this.selectedLang], NotificationType.WARNING);
            this.clearDownloadDropdown();
            return;
          }

          this.downloadSvc.downloadJsonAs(
            value as DownloadAsType,
            this.columns.slice(0, -1),
            this.filteredAppointments$$.value.map((ap: Appointment) => [
              ap?.startedAt?.toString(),
              ap?.endedAt?.toString(),
              `${this.titleCasePipe.transform(ap?.patientFname)} ${this.titleCasePipe.transform(ap?.patientLname)}`,
              this.titleCasePipe.transform(ap?.doctor),
              ap?.id.toString(),
              ap.createdAt.toString(),
              // ap.readStatus ? 'Yes' : 'No',
              AppointmentStatusToName[+ap.approval],
            ]),
            'physician',
          );

          if (value !== 'PRINT') {
            this.notificationSvc.showNotification(`${Translate.DownloadSuccess(value)[this.selectedLang]}`);
          }
          this.clearDownloadDropdown();

          this.downloadDropdownControl.setValue(null);

          this.cdr.detectChanges();
        }
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

    this.roomApiSvc.rooms$.pipe(takeUntil(this.destroy$$)).subscribe({
      next: (rooms) => {
        this.roomList = rooms.map(({name, id}) => ({name, value: id}));
      }
    });

    combineLatest([this.shareDataSvc.getLanguage$(), this.permissionSvc.permissionType$])
      .pipe(takeUntil(this.destroy$$))
      .subscribe({
        next: ([lang, permissionType]) => {
          this.selectedLang = lang;
          if (permissionType !== UserRoleEnum.Reader) {
            if (!this.columns.includes(Translate.Actions[lang])) {
              this.columns.push(Translate.Actions[lang]);
            }
          } else if (this.columns.includes(Translate.Actions[lang])) {
            this.columns.pop();
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
      .subscribe({
        next: () => this.notificationSvc.showNotification(Translate.SuccessMessage.StatusChanged[this.selectedLang])
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
      .subscribe({
        next: () => this.notificationSvc.showNotification(Translate.DeleteAppointment[this.selectedLang])
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
        dataString += `${ap?.startedAt?.toString()}\t${ap?.endedAt?.toString()}\t${this.titleCasePipe.transform(
          ap?.patientFname,
        )} ${this.titleCasePipe.transform(ap?.patientLname)}\t\t${this.titleCasePipe.transform(
          ap?.doctor,
          // eslint-disable-next-line no-unsafe-optional-chaining
        )}\t\t${ap?.id.toString()}\t\t${ap.createdAt.toString()}\t\t${ap?.readStatus ? 'Yes' : 'No'}\t\t${AppointmentStatusToName[+ap?.approval]}\n`;
      });

      this.clipboardData = dataString;
      this.cdr.detectChanges();
      this.notificationSvc.showNotification(Translate.SuccessMessage.CopyToClipboard[this.selectedLang]);
    } catch (e) {
      this.notificationSvc.showNotification(Translate.ErrorMessage.FailedToCopyData[this.selectedLang], NotificationType.DANGER);
      this.clipboardData = '';
    }
  }

  public navigateToView(e: TableItem, appointments: Appointment[]) {
    if (e?.id) {
      this.router.navigate([`/appointment/${e.id}/view`], { replaceUrl: true });
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

    modalRef.closed.pipe(take(1)).subscribe({
      next: (result) => this.filterAppointments(result)
    });
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

  openAdvancePopup() {
    const modalRef = this.modalSvc.open(AppointmentAdvanceSearchComponent, {
      data: {
        titleText: 'AdvancedSearch',
        confirmButtonText: 'Search',
        cancelButtonText: 'Reset',
        items: [
          ...this.appointments$$.value.map(({ id, patientLname, patientFname }) => {
            return {
              name: `${patientFname} ${patientLname}`,
              key: `${patientFname} ${patientLname} ${id}`,
              value: id,
            };
          }),
        ],
      },
      options: {
        size: 'xl',
        centered: true,
        backdropClass: 'modal-backdrop-remove-mv',
      },
    });

    modalRef.closed.pipe(
      switchMap((result) => this.appointmentApiSvc.fetchAllAppointments$(result)),
      take(1)
    ).subscribe({
      next: (appointments) => {
        // console.log('appointments filtered: ', appointments);
        this.appointments$$.next(appointments);
        this.filteredAppointments$$.next(appointments);

        // appointments.sort((ap1, ap2) => new Date(ap1?.startedAt).getTime() - new Date(ap2?.startedAt).getTime());
        //
        // console.log(appointments);
        //
        // this.groupAppointmentsForCalendar(...appointments);
        // this.groupAppointmentByDateAndRoom(...appointments);
        //
        // console.log(this.appointmentsGroupedByDate);
      }
        });
  }
  private clearDownloadDropdown() {
    setTimeout(() => {
      this.downloadDropdownControl.setValue('');
    }, 0);
  }
}