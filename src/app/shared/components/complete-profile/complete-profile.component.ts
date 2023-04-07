import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, takeUntil} from "rxjs";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {UserManagementApiService} from "../../../core/services/user-management-api.service";
import {UserApiService} from "../../../core/services/user-api.service";
import {DestroyableComponent} from "../destroyable.component";
import {AuthUser} from "../../models/user.model";
import {NotificationDataService} from "../../../core/services/notification-data.service";
import {Router} from "@angular/router";

@Component({
    selector: 'dfm-complete-profile',
    templateUrl: './complete-profile.component.html',
    styleUrls: ['./complete-profile.component.scss'],
})
export class CompleteProfileComponent extends DestroyableComponent implements OnInit, OnDestroy {
    public saving$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public user!: AuthUser;

    public completeProfileForm = new FormGroup({
        extension_Telephone: new FormControl('', Validators.required),
        extension_Gsm: new FormControl('', Validators.required),
        extension_Address: new FormControl('', Validators.required),
    });

    constructor(private userManagementApiSvc: UserManagementApiService, private userApiSvc: UserApiService, private notificationSvc: NotificationDataService, private router: Router) {
        super()
    }

    public ngOnInit(): void {
        this.userApiSvc.authUser$.pipe(takeUntil(this.destroy$$)).subscribe((user) => {
            console.log(user, 'auth user');
            this.user = user as AuthUser;
        });
    }

    public override ngOnDestroy(): void {
        super.ngOnDestroy();
    }

    public save(): void {
        if (this.completeProfileForm.invalid) {
            this.notificationSvc.showWarning('Form is invalid');
            this.completeProfileForm.markAllAsTouched();
            return
        }

        this.saving$$.next(true);

        this.userManagementApiSvc.patchUserProperties(this.user.id, {
            extension_ProfileIsIncomplete: false,
            ...this.completeProfileForm.value
        })
            .pipe(takeUntil(this.destroy$$))
            .subscribe({
                next: (res) => {
                    this.notificationSvc.showSuccess('Profile saved successfully.');
                    this.saving$$.next(false);
                    this.router.navigate(['/']);
                },
                error: (err) => {
                    this.notificationSvc.showError('Failed to save profile.');
                    this.saving$$.next(false);
                }
            });
    }
}
