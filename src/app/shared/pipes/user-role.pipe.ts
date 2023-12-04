import { Pipe, PipeTransform } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { UserApiService } from '../../core/services/user-api.service';
import { UserRoleEnum } from '../models/user.model';

@Pipe({
	name: 'dfmUserRole',
})
export class UserRolePipe implements PipeTransform {
	constructor(private userApiSvc: UserApiService) {}

	public transform(userId: string): Observable<UserRoleEnum> {
		if (userId) {
			return this.userApiSvc.getUserRole(userId);
		}
		return EMPTY;
	}
}
