// import { UserTenantItem } from './../models/user-tenant.model';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserPropertiesPermitItem } from '../models/user-properties-permit-item.model';
import { UserInviteResponse } from '../models/user-invite-response.model';
import { UserProperties } from '../models/user-properties.model';
import { UserBase } from '../models/user-base.model';
import { UserTenantItem } from '../models/user-tenant.model';
import { UserInvite } from '../models/invite.model';

@Injectable({
  providedIn: 'root',
})
export class UserManagementApiService {
  private baseUrl: string = environment.userManagementApiUrl;

  constructor(private httpClient: HttpClient) {}

  public getUserProperties(userId: string): Observable<UserProperties> {
    return this.httpClient.get<UserProperties>(`${this.baseUrl}/users/${userId}/properties`);
  }

  public patchUserProperties(userId: string, properties: Record<string, any>) {
    return this.httpClient.patch(`${this.baseUrl}/users/${userId}/properties`, { properties });
  }

  public getUserById(userId: string): Observable<UserBase> {
    return this.httpClient.get<UserBase>(`${this.baseUrl}/users/${userId}`);
  }

  public createUserInvite(userInvite: UserInvite): Observable<UserInviteResponse> {
    return this.httpClient.post<UserInviteResponse>(`${this.baseUrl}/users/invites`, userInvite);
  }

  public getPropertiesPermits(userId: string): Observable<UserPropertiesPermitItem[]> {
    return this.httpClient.get<UserPropertiesPermitItem[]>(`${this.baseUrl}/users/${userId}/properties/permits`);
  }

  public createPropertiesPermit(userId: string, tenantId: string): Observable<Record<string, string>> {
    return this.httpClient.post<Record<string, string>>(`${this.baseUrl}/users/${userId}/properties/permit`, { tenantId });
  }

  public revokePropertiesPermit(userId: string, tenantId: string): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/users/${userId}/properties/revoke`, { tenantId });
  }

  public getTenantGlobalPermissions(userId: string, tenantId: string): Observable<string[]> {
    return this.httpClient.get<string[]>(`${this.baseUrl}/users/${userId}/tenants/${tenantId}/global-permissions`);
  }

  public getUserTenantsList(userId: string): Observable<UserTenantItem[]> {
    return this.httpClient.get<UserTenantItem[]>(`${this.baseUrl}/users/${userId}/tenants`);
  }
}

