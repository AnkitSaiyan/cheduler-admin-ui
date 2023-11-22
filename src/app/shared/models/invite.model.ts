export class UserInvite {
	email: string = '';

	givenName: string = '';

	surName: string = '';

	contextTenantId: string = '';

	roles: string[] = [];

	redirect: UserInviteRedirect = { redirectUrl: '', clientId: '' };

	accountType: 'Local' = 'Local';

	externalProviderName: null = null;

	externalUserId: null = null;
}

export class UserInviteRedirect {
	redirectUrl: string = '';

	clientId: string = '';
}
