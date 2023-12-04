export interface UserInvite {
	email: string;
	givenName: string;
	surName: string;
	contextTenantId: string;
	roles: string[];
	redirect: UserInviteRedirect;
	accountType: 'Local';
	externalProviderName: null;
	externalUserId: null;
}

export interface UserInviteRedirect {
	redirectUrl: string;
	clientId: string;
}
