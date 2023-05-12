import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MSAL_GUARD_CONFIG, MsalBroadcastService, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { filter, of, Subject, switchMap, takeUntil } from 'rxjs';
import defaultLanguage from '../assets/i18n/nl-BE.json';
import englishLanguage from '../assets/i18n/en-BE.json';
import { NotificationDataService } from './core/services/notification-data.service';
import { DUTCH_BE, ENG_BE } from './shared/utils/const';
import { UserService } from './core/services/user.service';

@Component({
	selector: 'dfm-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
	public user?: any;

	isIframe = false;

	loginDisplay = false;

	private readonly destroying$$ = new Subject<void>();

	constructor(
		public translate: TranslateService,
		@Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
		private authService: MsalService,
		private msalBroadcastService: MsalBroadcastService,
		public userService: UserService,
		public notificationSvc: NotificationDataService,
	) {
		this.setupLanguage();
		this.setupUser();
	}

	ngOnInit(): void {
		this.setLoginDisplay();

		this.isIframe = window !== window.parent && !window.opener; // Remove this line to use Angular Universal

		this.authService.instance.enableAccountStorageEvents(); // Optional - This will enable ACCOUNT_ADDED and ACCOUNT_REMOVED events emitted when a user logs in or out of another tab or window
	}

	ngOnDestroy() {
		this.destroying$$.next();
		this.destroying$$.complete();
	}

	private setLoginDisplay() {
		this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
	}

	private setupUser() {
		this.msalBroadcastService.inProgress$
			.pipe(
				filter((status: InteractionStatus) => status === InteractionStatus.None),
				switchMap(() => {
					if (!this.authService.instance.getAllAccounts().length) {
						return of(null);
					}

					const activeAccount = this.authService.instance.getActiveAccount();
					if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
						const accounts = this.authService.instance.getAllAccounts();
						this.authService.instance.setActiveAccount(accounts[0]);
					}

					return this.userService.initializeUser();
				}),
				switchMap((x) => {
					if (!x) {
						setTimeout(() => this.userService.logout(), 1500);
					}
					return this.userService.authUser$;
				}),
				takeUntil(this.destroying$$),
			)
			.subscribe({
				next: (x) => {
					this.user = x;
				},
				error: () => {
					setTimeout(() => this.userService.logout(), 1500);
				},
			});
	}

	private setupLanguage() {
		this.translate.addLangs([ENG_BE, DUTCH_BE]);
		const lang = localStorage.getItem('lang');
		if (lang) {
			this.translate.setTranslation(lang, lang === DUTCH_BE ? defaultLanguage : englishLanguage);
			this.translate.setDefaultLang(lang);
		} else {
			this.translate.setTranslation(DUTCH_BE, defaultLanguage);
			this.translate.setDefaultLang(DUTCH_BE);
		}
	}
}
