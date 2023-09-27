import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MSAL_GUARD_CONFIG, MsalBroadcastService, MsalGuardConfiguration, MsalService } from '@azure/msal-angular';
import {
	AuthenticationResult,
	EventMessage,
	EventType,
	InteractionStatus,
} from '@azure/msal-browser';
import { IdTokenClaims } from '@azure/msal-common';
import { filter, Observable, Subject, switchMap, take, tap } from 'rxjs';
import defaultLanguage from '../assets/i18n/nl-BE.json';
import englishLanguage from '../assets/i18n/en-BE.json';
import { AuthConfig } from './configuration/auth.config';
import { NotificationDataService } from './core/services/notification-data.service';
import { DUTCH_BE, ENG_BE } from './shared/utils/const';
import { UserService } from './core/services/user.service';
import {AuthUser} from "./shared/models/user.model";
import {RouteName} from "./shared/models/permission.model";
import {Router} from "@angular/router";
import { BodyPartService } from './core/services/body-part.service';

type IdTokenClaimsWithPolicyId = IdTokenClaims & {
	acr?: string;
	tfp?: string;
};

@Component({
	selector: 'dfm-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
	public user$?: Observable<AuthUser | undefined>;

	private readonly _destroying$ = new Subject<void>();

	constructor(
		public translate: TranslateService,
		@Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
		private authService: MsalService,
		private msalBroadcastService: MsalBroadcastService,
		public userService: UserService,
		public notificationSvc: NotificationDataService,
		private router: Router,
		private bodyPartSvc: BodyPartService,
	) {}

	public ngOnInit(): void {
		this.setupLanguage();

		this.authService.instance.enableAccountStorageEvents();

		this.msalBroadcastService.msalSubject$
			.pipe(filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS))
			.subscribe((result: EventMessage) => {
				const payload = result.payload as AuthenticationResult;
				const idToken = payload.idTokenClaims as IdTokenClaimsWithPolicyId;

				if (idToken.acr === AuthConfig.authFlow || idToken.tfp === AuthConfig.authFlow) {
					this.authService.instance.setActiveAccount(payload.account);
				}
			});

		this.msalBroadcastService.inProgress$
			.pipe(
				filter((status: InteractionStatus) => status === InteractionStatus.None),
				switchMap(() => this.checkAndSetActiveAccount()),
			)
			.subscribe({
				next: (x) => {
					if (!x) {
						setTimeout(() => this.userService.logout(), 1500);
					}
				},
			});

		// To logout on every tab if user logs out in one tab
		this.msalBroadcastService.msalSubject$
			.pipe(filter((msg: EventMessage) => msg.eventType === EventType.ACCOUNT_ADDED || msg.eventType === EventType.ACCOUNT_REMOVED))
			.subscribe({
				next: () => {
					window.location.pathname = '/';
				},
			});

		this.user$ = this.userService.authUser$.pipe(
			tap((user) => {
				if (user) {
					if (user.properties['extension_ProfileIsIncomplete']) {
						this.router.navigate([`/${RouteName.CompleteProfile}`]);
					}
				}
			}),
		);
		this.bodyPartSvc.allBodyPart$().pipe(take(1)).subscribe();
	}

	private checkAndSetActiveAccount() {
		/**
		 * If no active account set but there are accounts signed in, sets first account to active account
		 * To use active account set here, subscribe to inProgress$ first in your component
		 * Note: Basic usage demonstrated. Your app may require more complicated account selection logic
		 */
		const activeAccount = this.authService.instance.getActiveAccount();

		if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
			const accounts = this.authService.instance.getAllAccounts();
			this.authService.instance.setActiveAccount(accounts[0]);
		}

		return this.userService.initializeUser();
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

	public ngOnDestroy() {
		this._destroying$.next();
		this._destroying$.complete();
	}
}
