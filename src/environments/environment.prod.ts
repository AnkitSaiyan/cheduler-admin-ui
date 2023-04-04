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
  userManagementApiUrl: 'https://auth.diflexmo.be/usermanagement/api/',
  authClientId: 'd526e147-4713-4a0a-bf56-d8f500fb9a62',
  redirectUrl: '/',
  schedulerApiAuthScope: 'https://diflexmoauth.onmicrosoft.com/cheduler.api/cheduler.api',
};
