import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, map, switchMap, take, takeUntil, tap } from 'rxjs';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { ModalService } from '../../../../core/services/modal.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { UserManagementApiService } from '../../../../core/services/user-management-api.service';
import { UserService } from '../../../../core/services/user.service';
import { ConfirmActionModalComponent, ConfirmActionModalData } from '../../../../shared/components/confirm-action-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Permission } from '../../../../shared/models/permission.model';
import { Translate } from '../../../../shared/models/translate.model';
import { User, UserType } from '../../../../shared/models/user.model';
import { ENG_BE, STAFF_ID } from '../../../../shared/utils/const';
import { AddUserComponent } from '../add-user/add-user.component';

@Component({
	selector: 'dfm-view-user',
	templateUrl: './view-user.component.html',
	styleUrls: ['./view-user.component.scss'],
})
export class ViewUserComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public userDetails$$ = new BehaviorSubject<User | undefined>(undefined);

	public currentUserType!: UserType;

	public userProperties: Record<string, string> = {};

	protected readonly Permission = Permission;

	private selectedLang: string = ENG_BE;

	constructor(
		private userApiSvc: UserApiService,
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
					if (authUser && authUser.id === userDetails?.id?.toString() && authUser?.properties) {
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
					return this.userManagementApiSvc.deleteUser(id as string);
				}),
				take(1),
			)
			.subscribe({
				next: () => {
					this.notificationSvc.showNotification(Translate.SuccessMessage.UserDeleted[this.selectedLang]);
					this.router.navigate(['/', 'user'], { queryParamsHandling: 'merge', relativeTo: this.route });
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
			},
		});
	}
}
