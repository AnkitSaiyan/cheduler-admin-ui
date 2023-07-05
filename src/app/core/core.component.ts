import {AfterViewInit, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {
    NavigationItem,
    NavigationItemEvent,
    NavigationItemEventType,
    NavigationProfileData,
    NavigationUser,
    SelectItem,
} from 'diflexmo-angular-design';
import {TranslateService} from '@ngx-translate/core';
import {MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalService} from '@azure/msal-angular';
import {
    BehaviorSubject,
    catchError,
    combineLatest,
    filter,
    map,
    Subject,
    switchMap,
    take,
    takeUntil,
    throwError
} from 'rxjs';
import {DestroyableComponent} from '../shared/components/destroyable.component';
import { DUTCH_BE, ENG_BE } from '../shared/utils/const';
import englishLanguage from '../../assets/i18n/en-BE.json';
import dutchLanguage from '../../assets/i18n/nl-BE.json';
import {ShareDataService} from './services/share-data.service';
import {DashboardApiService} from './services/dashboard-api.service';
import {LoaderService} from './services/loader.service';
import {UserApiService} from './services/user-api.service';
import {PermissionService} from './services/permission.service';
import {AuthUser, UserRoleEnum} from '../shared/models/user.model';
import {DateTimeUtils} from '../shared/utils/date-time.utils';
import {NotificationDataService} from "./services/notification-data.service";
import {UserService} from "./services/user.service";
import {DefaultDatePipe} from "../shared/pipes/default-date.pipe";
import { ModalService } from './services/modal.service';
import { ConfirmActionModalComponent } from '../shared/components/confirm-action-modal.component';

@Component({
	selector: 'dfm-main',
	templateUrl: './core.component.html',
	styleUrls: ['./core.component.scss'],
})
export class CoreComponent extends DestroyableComponent implements OnInit, OnDestroy, AfterViewInit {
	public notifications: NavigationItemEvent[] = [];

	public notifications$$ = new BehaviorSubject<NavigationItemEvent[]>([]);

	public messages: NavigationItemEvent[] = [];

	public messages$$ = new BehaviorSubject<NavigationItemEvent[]>([]);

	public currentTenant$$ = new BehaviorSubject<string>(DUTCH_BE);

	public loggingOut$$ = new BehaviorSubject(false);

	public languages: SelectItem[] = [
		{ name: 'EN', value: ENG_BE },
		{ name: 'NL', value: DUTCH_BE },
	];

	public profileData: NavigationProfileData = {
		user: {
			name: '',
			email: '',
			avatar: '',
			isLinkExternal: false,
		},
		links: [],
	};
	public isLoaderActive$$ = new Subject<boolean>();

	public navItems: NavigationItem[] = [];

	public user!: AuthUser;

	private navigationItems: NavigationItem[] = [
		new NavigationItem('Dashboard', 'home-03', '/dashboard', false),
		new NavigationItem('Appointment', 'file-06', '/appointment', false),
		new NavigationItem('Absence', 'user-x-01', '/absence', false),
		new NavigationItem('Configuration', 'tool-02', undefined, false, [
			new NavigationItem('User', 'user-circle', '/user', false),
			new NavigationItem('Rooms', 'building-01', '/room', false),
			new NavigationItem('Staff', 'user-01', '/staff', false),
			new NavigationItem('Physician', 'medical-circle', '/physician', false),
			new NavigationItem('Examination', 'microscope', '/exam', false),
			new NavigationItem('Practice Hours', 'clock', '/practice-hours', false),
			new NavigationItem('Priority Slots', 'calendar-date', '/priority-slots', false),
			new NavigationItem('E-mail Template', 'mail-05', '/email-template', false),
			new NavigationItem('Site Management', 'tool-01', '/site-management', false),
		]),
	];
	private readerNavigationItems: NavigationItem[] = [
		new NavigationItem('Dashboard', 'home-03', '/dashboard', false),
		new NavigationItem('Appointment', 'file-06', '/appointment', false),
		new NavigationItem('Absence', 'user-x-01', '/absence', false),
		new NavigationItem('Configuration', 'tool-02', undefined, false, [
			new NavigationItem('User', 'user-circle', '/user', false),
			new NavigationItem('Rooms', 'building-01', '/room', false),
			new NavigationItem('Staff', 'user-01', '/staff', false),
			new NavigationItem('Physician', 'medical-circle', '/physician', false),
			new NavigationItem('Examination', 'microscope', '/exam', false),
			new NavigationItem('Priority Slots', 'calendar-date', '/priority-slots', false),
		]),
	];
	private navigationItemsNL: NavigationItem[] = [
		new NavigationItem('Dashboard', 'home-03', '/dashboard', false),
		new NavigationItem('Afspraak', 'file-06', '/appointment', false),
		new NavigationItem('Afwezigheid', 'user-x-01', '/absence', false),
		new NavigationItem('Configuratie', 'tool-02', undefined, false, [
			new NavigationItem('Gebruiker', 'user-circle', '/user', false),
			new NavigationItem('Zalen', 'building-01', '/room', false),
			new NavigationItem('Medewerker', 'user-01', '/staff', false),
			new NavigationItem('Dokter', 'medical-circle', '/physician', false),
			new NavigationItem('Onderzoek', 'microscope', '/exam', false),
			new NavigationItem('Uren praktijk', 'clock', '/practice-hours', false),
			new NavigationItem('Prioritaire slots', 'calendar-date', '/priority-slots', false),
			new NavigationItem('E-mail Sjabloon', 'mail-05', '/email-template', false),
			new NavigationItem('Site Beheer', 'tool-01', '/site-management', false),
		]),
	];
	private readerNavigationItemsNL: NavigationItem[] = [
		new NavigationItem('Dashboard', 'home-03', '/dashboard', false),
		new NavigationItem('Afspraak', 'file-06', '/appointment', false),
		new NavigationItem('Afwezigheid', 'user-x-01', '/absence', false),
		new NavigationItem('Configuratie', 'tool-02', undefined, false, [
			new NavigationItem('Gebruiker', 'user-circle', '/user', false),
			new NavigationItem('Zalen', 'building-01', '/room', false),
			new NavigationItem('Medewerker', 'user-01', '/staff', false),
			new NavigationItem('Dokter', 'medical-circle', '/physician', false),
			new NavigationItem('Onderzoek', 'microscope', '/exam', false),
			new NavigationItem('Prioritaire slots', 'calendar-date', '/priority-slots', false),
		]),
	];

	constructor(
		@Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
		private translateService: TranslateService,
		public dataShareService: ShareDataService,
		private dashboardApiService: DashboardApiService,
		public loaderService: LoaderService,
		private cdr: ChangeDetectorRef,
		private msalSvc: MsalService,
		private userSvc: UserService,
		private userApiSvc: UserApiService,
		private permissionSvc: PermissionService,
		private notificationSvc: NotificationDataService,
		private defaultDatePipe: DefaultDatePipe,
		private modalSvc: ModalService,
	) {
		super();

		this.fetchUserAndUserRoles();
	}

	public ngOnInit(): void {
		this.translateData();

		this.dataShareService
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (language: string) => this.currentTenant$$.next(language),
			});

		this.dashboardApiService.clearNotification$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (res) => {
				this.notifications = [];
				res.forEach((element) => {
					const date: Date = DateTimeUtils.UTCDateToLocalDate(new Date(element.date));
					this.notifications.push(
						new NavigationItemEvent(element?.apmtId.toString(), date, element?.title, NavigationItemEventType.SUCCESS, element?.message),
					);
				});
				this.notifications$$.next(this.notifications);
			},
		});

		this.dashboardApiService.clearPosts$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (res) => {
				this.messages = [];
				res.forEach((element) => {
					this.messages.push(
						new NavigationItemEvent(element.id.toString(), DateTimeUtils.UTCDateToLocalDate(new Date(element.createdAt)), element?.message),
					);
				});
				this.messages$$.next(this.messages);
			},
		});
	}

	public ngAfterViewInit(): void {
		this.loaderService.isActive$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (value) => {
				this.isLoaderActive$$.next(value);
				this.cdr.detectChanges();
			},
		});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
	}

	public onLanguageChange(lang: string) {
		this.dataShareService.setLanguage(lang);
		if (lang == ENG_BE) {
			this.translateService.setTranslation(lang, englishLanguage);
			this.translateService.setDefaultLang(lang);
		} else if (lang == DUTCH_BE) {
			this.translateService.setTranslation(lang, dutchLanguage);
			this.translateService.setDefaultLang(lang);
		}
	}

	public onDismissed(event: string[], type: 'post-its' | 'appointment') {
		if (type === 'post-its') {
			this.dashboardApiService
				.clearPost(event.map((value) => +value))
				.pipe(take(1))
				.subscribe();
		} else {
			this.dashboardApiService
				.clearNotification(event.map((value) => +value))
				.pipe(take(1))
				.subscribe();
		}
	}

	public logout() {
		const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'LogoutConfirmation',
				bodyText: 'Areyousurewanttologout',
				cancelButtonText: 'Cancel',
				confirmButtonText: 'Logout',
			},
		});

		modalRef.closed
			.pipe(
				filter((res) => !!res),
				take(1),
			)
			.subscribe({
				next: () => {
					this.loggingOut$$.next(true);
					this.userSvc.logout();
				},
			});
	}

	private fetchUserAndUserRoles() {
		combineLatest([this.userSvc.authUser$, this.loggingOut$$])
			.pipe(
				filter(([_, loggingOut]) => !loggingOut),
				switchMap(([user, _]) => {
					if (!user) {
						throw Error('Failed to fetch user details. Logging out.');
					}

					this.profileData = new NavigationProfileData(new NavigationUser(user.displayName, user.email, '', '', false), []);

					return this.userApiSvc.getUserRole(user.id).pipe(
						map((userRole) => {
							if (!userRole) {
								throw Error();
							}

							// Set user permission
							this.permissionSvc.setPermissionType(userRole);

							this.user = user as AuthUser;
						}),
						catchError(() => {
							const error: any = new Error('Failed to get user roles. Logging out.');
							return throwError(error);
						}),
					);
				}),
				takeUntil(this.destroy$$),
				catchError((err) => throwError(err)),
			)
			.subscribe({
				error: (err) => {
					this.notificationSvc.showError(err);
					setTimeout(() => this.userSvc.logout(), 1500);
				},
			});
	}

	private translateData() {
		// translation changes should go here
		combineLatest([this.currentTenant$$, this.permissionSvc.permissionType$])
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: ([lang, permissionType]) => {
					// eslint-disable-next-line default-case
					switch (lang) {
						case ENG_BE: {
							if (permissionType !== UserRoleEnum.Admin) {
								this.navItems = [...this.readerNavigationItems];
								break;
							}
							this.navItems = [...this.navigationItems];
							break;
						}
						case DUTCH_BE: {
							if (permissionType !== UserRoleEnum.Admin) {
								this.navItems = [...this.readerNavigationItemsNL];
								break;
							}
							this.navItems = [...this.navigationItemsNL];
							break;
						}
					}
				},
			});
	}

	protected readonly DUTCH_BE = DUTCH_BE;
}
