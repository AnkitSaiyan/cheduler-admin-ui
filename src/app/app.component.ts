import { Component, Inject, OnInit } from '@angular/core';
import { Tooltip } from 'bootstrap';
import { TranslateService } from '@ngx-translate/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { environment } from 'src/environments/environment';
import { MsalBroadcastService, MsalGuardConfiguration, MsalService, MSAL_GUARD_CONFIG } from '@azure/msal-angular';
import {
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionStatus,
  InteractionType,
  PopupRequest,
  RedirectRequest,
} from '@azure/msal-browser';
// eslint-disable-next-line import/no-extraneous-dependencies, @typescript-eslint/no-unused-vars
import { IdTokenClaims } from '@azure/msal-common';
import { filter, Subject, takeUntil } from 'rxjs';
import defaultLanguage from '../assets/i18n/nl-BE.json';
import englishLanguage from '../assets/i18n/en-BE.json';
import { AuthConfig } from './configuration/auth.config';
import { UserApiService } from './core/services/user-api.service';
// import dutchLangauge from '../assets/i18n/nl-BE.json';

type IdTokenClaimsWithPolicyId = IdTokenClaims & {
  acr?: string;
  tfp?: string;
};

@Component({
  selector: 'dfm-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public user?: any;

  isIframe = false;

  loginDisplay = false;

  private readonly _destroying$ = new Subject<void>();

  constructor(
    public translate: TranslateService,
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    public userService: UserApiService,
  ) {
    translate.addLangs(['en-BE', 'nl-BE']);
    const lang = localStorage.getItem('lang');
    if (lang) {
      translate.setTranslation(lang, lang === 'nl-BE' ? defaultLanguage : englishLanguage);
      translate.setDefaultLang(lang);
    } else {
      translate.setTranslation('nl-BE', defaultLanguage);
      translate.setDefaultLang('nl-BE');
    }
  }

  ngOnInit(): void {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((e) => new Tooltip(e));

    this.isIframe = window !== window.parent && !window.opener; // Remove this line to use Angular Universal
    this.setLoginDisplay();

    this.authService.instance.enableAccountStorageEvents(); // Optional - This will enable ACCOUNT_ADDED and ACCOUNT_REMOVED events emitted when a user logs in or out of another tab or window
    this.msalBroadcastService.msalSubject$
      .pipe(filter((msg: EventMessage) => msg.eventType === EventType.ACCOUNT_ADDED || msg.eventType === EventType.ACCOUNT_REMOVED))
      .subscribe({
        next: () => {
          if (this.authService.instance.getAllAccounts().length === 0) {
            window.location.pathname = '/';
          } else {
            this.setLoginDisplay();
          }
        }
      });

    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        // eslint-disable-next-line no-underscore-dangle
        takeUntil(this._destroying$),
      )
      .subscribe({
        next: () => {
          this.setLoginDisplay();
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

          return result;
        }
      });
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

    console.log(this.authService.instance.getActiveAccount());

    this.userService.authUser$.subscribe({
      next: (x) => (this.user = x)
    });

    this.userService.initializeUser().subscribe({
      next: (x) => {
        if (!x) {
          console.log('User login failed. Logging out.');
          this.logout();
        }
      }
    });
  }

  loginRedirect() {
    if (this.msalGuardConfig.authRequest) {
      this.authService.loginRedirect({ ...this.msalGuardConfig.authRequest } as RedirectRequest);
    } else {
      this.authService.loginRedirect();
    }
  }

  login(userFlowRequest?: RedirectRequest | PopupRequest) {
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      if (this.msalGuardConfig.authRequest) {
        this.authService
          .loginPopup({ ...this.msalGuardConfig.authRequest, ...userFlowRequest } as PopupRequest)
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
      this.authService.loginRedirect({ ...this.msalGuardConfig.authRequest, ...userFlowRequest } as RedirectRequest);
    } else {
      this.authService.loginRedirect(userFlowRequest);
    }
  }

  private logout() {
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      this.authService.logoutPopup({
        mainWindowRedirectUri: '/',
      });
    } else {
      this.authService.logoutRedirect();
    }
  }
}
