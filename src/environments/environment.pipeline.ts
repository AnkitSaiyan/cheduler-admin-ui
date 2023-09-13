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
  schedulerApiUrl: '$(schedulerApiUrl)',
  userManagementApiUrl: '$(userManagementApiUrl)',
  authClientId: '$(authClientId)',
  redirectUrl: window.location.origin,
  schedulerApiAuthScope: '$(schedulerApiAuthScope)',
};
