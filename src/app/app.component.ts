import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {MSAL_GUARD_CONFIG, MsalBroadcastService, MsalGuardConfiguration, MsalService} from '@azure/msal-angular';
import {
    AuthenticationResult,
    EventMessage,
    EventType,
    InteractionStatus,
    InteractionType,
    PopupRequest,
    RedirectRequest,
} from '@azure/msal-browser';
import {IdTokenClaims} from '@azure/msal-common';
import {filter, Subject , takeUntil} from 'rxjs';
import defaultLanguage from '../assets/i18n/nl-BE.json';
import englishLanguage from '../assets/i18n/en-BE.json';
import {AuthConfig} from './configuration/auth.config';
import {NotificationDataService} from "./core/services/notification-data.service";
import {DUTCH_BE, ENG_BE} from "./shared/utils/const";
import {UserService} from "./core/services/user.service";

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
    public user?: any;

    isIframe = false;

    loginDisplay = false;

    private readonly _destroying$ = new Subject<void>();

    constructor(
        public translate: TranslateService,
        @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
        private authService: MsalService,
        private msalBroadcastService: MsalBroadcastService,
        public userService: UserService,
        public notificationSvc: NotificationDataService
    ) {
    }

    ngOnInit(): void {
        this.setupLanguage();

        this.isIframe = window !== window.parent && !window.opener; // Remove this line to use Angular Universal

        this.setLoginDisplay();

        this.authService.instance.enableAccountStorageEvents(); // Optional - This will enable ACCOUNT_ADDED and ACCOUNT_REMOVED events emitted when a user logs in or out of another tab or window
        this.msalBroadcastService.msalSubject$
            .pipe(
                filter((msg: EventMessage) => msg.eventType === EventType.ACCOUNT_ADDED || msg.eventType === EventType.ACCOUNT_REMOVED),
                takeUntil(this._destroying$)
            )
            .subscribe({
                next: () => {
                    if (this.authService.instance.getAllAccounts().length === 0) {
                        window.location.pathname = '/';
                    } else {
                        // this.setLoginDisplay();
                        this.checkAndSetActiveAccount();
                    }
                }
            });

        this.msalBroadcastService.inProgress$
            .pipe(
                filter((status: InteractionStatus) => status === InteractionStatus.None),
                takeUntil(this._destroying$),
            )
            .subscribe({
                next: (status) => {
                    // this.setLoginDisplay();
                    this.checkAndSetActiveAccount();
                }
            });

        this.msalBroadcastService.msalSubject$
            .pipe(
                filter(
                    (msg: EventMessage) =>
                        msg.eventType === EventType.LOGIN_SUCCESS ||
                        msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS ||
                        msg.eventType === EventType.SSO_SILENT_SUCCESS,
                ),
                // eslint-disable-next-line no-underscore-dangle
                takeUntil(this._destroying$),
            )
            .subscribe({
                next: (result: EventMessage) => {
                    const payload = result.payload as AuthenticationResult;
                    const idToken = payload.idTokenClaims as IdTokenClaimsWithPolicyId;

                    if (idToken.acr === AuthConfig.authFlow || idToken.tfp === AuthConfig.authFlow) {
                        this.authService.instance.setActiveAccount(payload.account);
                    }

                    // return result;
                }
            });
    }

    loginRedirect() {
        if (this.msalGuardConfig.authRequest) {
            this.authService.loginRedirect({...this.msalGuardConfig.authRequest} as RedirectRequest);
        } else {
            this.authService.loginRedirect();
        }
    }

    login(userFlowRequest?: RedirectRequest | PopupRequest) {
        if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
            if (this.msalGuardConfig.authRequest) {
                this.authService
                    .loginPopup({...this.msalGuardConfig.authRequest, ...userFlowRequest} as PopupRequest)
                    .subscribe({
                        next: (response: AuthenticationResult) => {
                            this.authService.instance.setActiveAccount(response.account);
                        }
                    });
            } else {
                this.authService.loginPopup(userFlowRequest).subscribe({
                    next: (response: AuthenticationResult) => {
                        this.authService.instance.setActiveAccount(response.account);
                    }
                });
            }
        } else if (this.msalGuardConfig.authRequest) {
            this.authService.loginRedirect({...this.msalGuardConfig.authRequest, ...userFlowRequest} as RedirectRequest);
        } else {
            this.authService.loginRedirect(userFlowRequest);
        }
    }

    ngOnDestroy() {
        this._destroying$.next();
        this._destroying$.complete();
    }

    private setLoginDisplay() {
        this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
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

        this.userService.authUser$.pipe(takeUntil(this._destroying$)).subscribe({
            next: (x) => (this.user = x)
        });

        this.userService.initializeUser().subscribe({
            next: (x) => {
                if (!x) {
                    // not showing error for now
                    // this.userService.logout();
                    // this.notificationSvc.showError('User login failed. Logging out.');
                    setTimeout(() => this.userService.logout(), 1500);
                } else {
                    this.setLoginDisplay();
                }
            }
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
