interface Environment {
  production: boolean;
  serverBaseUrl: string;
}

export const environment: Environment = {
  production: true,
  serverBaseUrl: 'https://diflexmo-scheduler-api-dev.azurewebsites.net/api',
};
