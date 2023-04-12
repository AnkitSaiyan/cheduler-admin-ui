import {Component, OnDestroy, OnInit} from '@angular/core';
import {take} from 'rxjs';
import {FormControl, Validators} from '@angular/forms';
import {ModalService} from '../../../../core/services/modal.service';
import {NameValue} from '../../../../shared/components/search-modal.component';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {Appointment} from "../../../../shared/models/appointment.model";
import {UserType} from "../../../../shared/models/user.model";
import {NameValuePairPipe} from "../../../../shared/pipes/name-value-pair.pipe";
import {UserApiService} from "../../../../core/services/user-api.service";

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
            if (data.exams[0].allUsers) {
                this.radiologists = [
                    ...this.nameValuePipe.transform(
                        data.exams[0].allUsers.filter((user) => user.userType === UserType.Radiologist),
                        'firstname',
                        'id',
                    ),
                ];
            }

            if (data.exams[0].users) {
                const selected: string[] = [];
                this.selectedRadiologists = [
                    ...this.nameValuePipe.transform(
                        data.exams[0].users.filter((user) => {
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

                this.radiologistFormControl.setValue(selected);
            }
        })
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
