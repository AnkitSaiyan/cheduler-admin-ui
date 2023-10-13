import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import { GeneralUserPermission, ReaderPermission } from 'src/app/shared/models/permission.model';
import { UserRoleEnum } from '../../shared/models/user.model';

@Injectable({
	providedIn: 'root',
})
export class PermissionService {
	private permissionType$$: BehaviorSubject<UserRoleEnum | undefined>;

	constructor() {
		const userRole = localStorage.getItem('userRole');
		this.permissionType$$ = new BehaviorSubject<UserRoleEnum | undefined>((userRole as UserRoleEnum) ?? UserRoleEnum.Admin);
	}

	public get permissionType$(): Observable<UserRoleEnum> {
		return this.permissionType$$.asObservable() as Observable<UserRoleEnum>;
	}

	public get permissionType(): UserRoleEnum {
		return this.permissionType$$.value as UserRoleEnum;
	}

	public setPermissionType(value: UserRoleEnum) {
		this.permissionType$$.next(value);
	}

	public removePermissionType() {
		this.permissionType$$.next(undefined);
	}

	public get isNotReader() {
		return this.permissionType$$.value !== UserRoleEnum.Reader;
	}

	public isPermitted(permission: string | string[]): boolean {
		const elementPermission = Array.isArray(permission) ? permission : [permission];
		switch (this.permissionType$$.value) {
			case UserRoleEnum.GeneralUser:
				return elementPermission.some((elePermission) => Object.values(GeneralUserPermission).find((value) => value === elePermission));
			case UserRoleEnum.Reader:
				return elementPermission.some((elePermission) => Object.values(ReaderPermission).find((value) => value === elePermission));
			default:
				return true;
		}
	}
}

















