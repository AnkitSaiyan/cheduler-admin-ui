interface Environment {
  production: boolean;
  serverBaseUrl: string;
}

export const environment: Environment = {
  production: true,
  serverBaseUrl: 'http://diflexmo-scheduler-api-uat.azurewebsites.net/api',
};
