import { Component, OnDestroy, OnInit } from '@angular/core';
import { take, takeUntil } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { GeneralUtils } from 'src/app/shared/utils/general.utils';
import { ModalService } from '../../../../core/services/modal.service';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { Appointment } from '../../../../shared/models/appointment.model';
import { UserType } from '../../../../shared/models/user.model';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { UserApiService } from '../../../../core/services/user-api.service';

@Component({
	selector: 'dfm-change-radiologist-modal',
	templateUrl: './change-radiologist-modal.component.html',
	styleUrls: ['./change-radiologist-modal.component.scss'],
})
export class ChangeRadiologistModalComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public radiologistFormControl = new FormControl<string[]>([], [Validators.required]);

	public radiologists: NameValue[] = [];

	public selectedRadiologists: NameValue[] = [];

	constructor(private dialogSvc: ModalService, private userApiService: UserApiService, private nameValuePipe: NameValuePairPipe) {
		super();
	}

	public ngOnInit(): void {
		this.dialogSvc.dialogData$.pipe(take(1)).subscribe((data: Appointment) => {
			const allUsers = GeneralUtils.removeDuplicateData(
				data?.examDetail?.[0]?.usersList ?? [],
				'id',
			);
			const users = data?.exams?.[0]?.users ?? [];
			if (data.isOutside) {
				this.userApiService.allStaffs$.pipe(takeUntil(this.destroy$$)).subscribe({
					next: (allUser) => {
						this.setDropDownData(allUser, users);
					},
				});
			} else {
				this.setDropDownData(allUsers, users);
			}
		});
	}

	private setDropDownData(allUsers, users): void {
		if (allUsers.length) {
			this.radiologists = [
				...this.nameValuePipe.transform(
					allUsers.filter((user) => user.userType === UserType.Radiologist),
					'firstname',
					'id',
				),
			];
		}

		if (users.length) {
			const selected: string[] = [];
			this.selectedRadiologists = [
				...this.nameValuePipe.transform(
					users.filter((user) => {
						if (user.userType === UserType.Radiologist) {
							selected.push(user.id.toString());
							return true;
						}
						return false;
					}),
					'firstname',
					'id',
				),
			];

			setTimeout(() => {
				this.radiologistFormControl.setValue(selected);
			}, 200);
		}
	}

	public closeDialog(): void {
		this.dialogSvc.close(null);
	}

	public save(): void {
		if (this.radiologistFormControl.invalid) {
			this.radiologistFormControl.markAsTouched();
			return;
		}

		this.dialogSvc.close(this.radiologistFormControl.value);
	}
}
