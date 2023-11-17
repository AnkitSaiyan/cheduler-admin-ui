interface Environment {
	production: boolean;
	schedulerApiUrl: string;
	authClientId: string;
	userManagementApiUrl: string;
	redirectUrl: string;
	schedulerApiAuthScope: string;
}

export const environment: Environment = {
	production: true,
	schedulerApiUrl: 'https://diflexmo-scheduler-api-dev.azurewebsites.net/api',
	userManagementApiUrl: 'https://auth-dev.diflexmo.be/usermanagement/api',
	authClientId: 'cf1fa2ba-8272-4875-b6c2-0cea52ee30a2',
	redirectUrl: window.location.origin + '/admin',
	schedulerApiAuthScope: 'https://diflexmoauthdev.onmicrosoft.com/cheduler.api/cheduler.api',
};
