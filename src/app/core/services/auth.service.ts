import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {ChedulerCacheKey, UserManagementCacheKey} from "../../shared/utils/const";
import {TokenDetailsCache} from "../../shared/models/cache.model";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tenantId: string = ''
  constructor() {
  }

  private getTokenDetails(key: string): TokenDetailsCache | null {
    try {
      const details = localStorage.getItem(key);
      if (details) {
        return JSON.parse(details) as TokenDetailsCache;
      }
      return null;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  public get chedulerToken(): string {
    return this.getTokenDetails(ChedulerCacheKey)?.secret ?? '';
  }

  public get userManagementToken(): string {
    return this.getTokenDetails(UserManagementCacheKey)?.secret ?? '';
  }

  public getTenantId(): string {
    return this.tenantId;
  }
}
