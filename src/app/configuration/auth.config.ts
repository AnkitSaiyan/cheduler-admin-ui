import { environment } from 'src/environments/environment';
import { BrowserCacheLocation, Configuration, LogLevel } from '@azure/msal-browser';
import { ProtectedApi } from './protected.config';

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1; // Remove this line to use Angular Universal
export class AuthConfig {
	static readonly protectedApis: ProtectedApi[] = [
		{
			url: environment.schedulerApiUrl,
			scope: environment.schedulerApiAuthScope,
		},
		{
			url: environment.userManagementApiUrl,
			scope: 'https://diflexmoauthdev.onmicrosoft.com/usermanagement.api/usermanagement.api',
		},
	];

	static readonly fullAuthority: string = 'https://diflexmoauthdev.b2clogin.com/diflexmoauthdev.onmicrosoft.com';

	static readonly authFlow: string = 'B2C_1_Cheduler_SignIn';

	static readonly authority: string = 'diflexmoauthdev.b2clogin.com';

	static readonly authClientId: string = environment.authClientId;
}

export const MSALConfig: Configuration = Object.freeze({
	auth: {
		clientId: AuthConfig.authClientId,
		authority: `${AuthConfig.fullAuthority}/${AuthConfig.authFlow}`,
		knownAuthorities: [AuthConfig.authority],
		redirectUri: environment.redirectUrl,
	},
	cache: {
		cacheLocation: BrowserCacheLocation.LocalStorage,
		storeAuthStateInCookie: isIE,
	},
	system: {
		loggerOptions: {
			loggerCallback: () => {
				//
			},
			logLevel: LogLevel.Verbose,
			piiLoggingEnabled: true,
		},
	},
});
