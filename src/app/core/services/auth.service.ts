import { Injectable } from '@angular/core';
import { ChedulerCacheKey, UserManagementCacheKey } from '../../shared/utils/const';
import { TokenDetailsCache } from '../../shared/models/cache.model';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private getTokenDetails(key: string): TokenDetailsCache | null {
		try {
			const details = localStorage.getItem(key);
			if (details) {
				return JSON.parse(details) as TokenDetailsCache;
			}
			return null;
		} catch (e) {

			return null;
		}
	}

	public get chedulerToken(): string {
		return this.getTokenDetails(ChedulerCacheKey)?.secret ?? '';
	}

	public get userManagementToken(): string {
		return this.getTokenDetails(UserManagementCacheKey)?.secret ?? '';
	}
}

