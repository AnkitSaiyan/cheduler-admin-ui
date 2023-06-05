import {Component, OnDestroy, OnInit} from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, switchMap, take, takeUntil, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { ENG_BE, STAFF_ID } from '../../../../shared/utils/const';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { AddUserComponent } from '../add-user/add-user.component';
import { User, UserType } from '../../../../shared/models/user.model';
import { getUserTypeEnum } from '../../../../shared/utils/getEnums';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { UserManagementApiService } from '../../../../core/services/user-management-api.service';
import { Permission } from '../../../../shared/models/permission.model';
import { UserApiService } from '../../../../core/services/user-api.service';
import { UserService } from '../../../../core/services/user.service';

@Component({
	selector: 'dfm-view-user',
	templateUrl: './view-user.component.html',
	styleUrls: ['./view-user.component.scss'],
})
export class ViewUserComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public userDetails$$ = new BehaviorSubject<User | undefined>(undefined);

	public userTypeEnum = getUserTypeEnum();

	public currentUserType!: UserType;

	public userProperties: Record<string, string> = {};

	protected readonly UserType = UserType;

	protected readonly Permission = Permission;

	private selectedLang: string = ENG_BE;

	constructor(
		private userApiSvc: UserApiService,
		private routerStateSvc: RouterStateService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private modalSvc: ModalService,
		private shareDataService: ShareDataService,
		private userManagementApiSvc: UserManagementApiService,
		public userSvc: UserService,
		private route: ActivatedRoute,
	) {
		super();
	}

	public ngOnInit(): void {
		combineLatest([
			this.userSvc.authUser$,
			this.route.params.pipe(
				map((params) => params[STAFF_ID]),
				switchMap((userID) => {
					if (this.router.url.split('/')[3] === 's') {
						return this.userManagementApiSvc.getUserById(userID).pipe(
							map(
								(user) =>
									({
										id: user.id,
										email: user.email,
										firstname: user.givenName,
										lastname: user.surname,
										fullName: user.displayName,
										userType: UserType.Scheduler,
										status: +user.accountEnabled,
									} as unknown as User),
							),
						);
					}
					return this.userApiSvc.getUserByID$(+userID).pipe() as Observable<User>;
				}),
				tap((user) => {
					this.currentUserType = user.userType;
				}),
			),
		])
			.pipe(take(1))
			.subscribe({
				next: ([authUser, userDetails]) => {
					this.userDetails$$.next(userDetails);
					this.userProperties = {};
					if (authUser && authUser.id === userDetails.id.toString() && authUser?.properties) {
						this.userProperties = authUser.properties;
					}
				},
			});

		this.shareDataService
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => (this.selectedLang = lang),
			});
	}

	public deleteUser(id: number | string) {
		const modalRef = this.modalSvc.open(ConfirmActionModalComponent, {
			data: {
				titleText: 'Confirmation',
				bodyText: 'AreyousureyouwanttodeletethisUser',
				confirmButtonText: 'Delete',
				cancelButtonText: 'Cancel',
			} as ConfirmActionModalData,
		});

		modalRef.closed
			.pipe(
				filter((res: boolean) => res),
				switchMap(() => {
					if (this.currentUserType === UserType.Scheduler) {
						return this.userManagementApiSvc.deleteUser(id as string);
					}
					return this.userApiSvc.deleteUser(id as number);
				}),
				take(1),
			)
			.subscribe({
				next: () => {
					this.notificationSvc.showNotification(Translate.SuccessMessage.UserDeleted[this.selectedLang]);
					this.router.navigate(['/', 'user']);
				},
			});
	}

	public openEditUserModal() {
		const modalRef = this.modalSvc.open(AddUserComponent, {
			data: { edit: !!this.userDetails$$.value?.id, userDetails: { ...this.userDetails$$.value } },
			options: {
				size: 'lg',
				centered: true,
				backdropClass: 'modal-backdrop-remove-mv',
			},
		});

		modalRef.closed.pipe(take(1)).subscribe({
			next: (user) => {
				if (user) {
					this.userDetails$$.next(user);
				}
			}
		})
	}
}
