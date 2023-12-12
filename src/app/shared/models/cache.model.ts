export interface TokenDetailsCache {
	cachedAt: number;
	clientId: string;
	credentialType: string;
	environment: string;
	expiresOn: number;
	extendedExpiresOn: number;
	homeAccountId: string;
	realm: string;
	secret: string;
	target: string;
	tokenType: string;
}
