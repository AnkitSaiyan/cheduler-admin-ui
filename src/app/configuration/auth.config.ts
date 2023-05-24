import {environment} from 'src/environments/environment';
import {ProtectedApi} from './protected.config';
import {BrowserCacheLocation, Configuration, LogLevel} from "@azure/msal-browser";

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1; // Remove this line to use Angular Universal
export class AuthConfig {
    static readonly protectedApis: ProtectedApi[] = [
        {
            url: environment.schedulerApiUrl,
            scope: environment.schedulerApiAuthScope,
        },
        {
            url: environment.userManagementApiUrl,
            scope: 'https://diflexmoauth.onmicrosoft.com/usermanagement.api/usermanagement.api',
        },
    ];
    static readonly fullAuthority: string = 'https://diflexmoauth.b2clogin.com/diflexmoauth.onmicrosoft.com';
    static readonly authFlow: string = 'B2C_1_Cheduler_Staff_SignIn';
    static readonly authority: string = 'diflexmoauth.b2clogin.com';
    static readonly authClientId: string = environment.authClientId;
}

export const MSALConfig: Configuration = Object.freeze({
	auth: {
		clientId: AuthConfig.authClientId,
		authority: `${AuthConfig.fullAuthority}/${AuthConfig.authFlow}`,
		knownAuthorities: [AuthConfig.authority],
		redirectUri: window.origin,
	},
	cache: {
		cacheLocation: BrowserCacheLocation.LocalStorage,
		storeAuthStateInCookie: isIE,
	},
	system: {
		loggerOptions: {
			loggerCallback: (logLevel, message) => {
				//
			},
			logLevel: LogLevel.Verbose,
			piiLoggingEnabled: true,
		},
	},
});



