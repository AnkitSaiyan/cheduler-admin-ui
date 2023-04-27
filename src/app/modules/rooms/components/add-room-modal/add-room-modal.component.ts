import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, of, Subject, switchMap, take, takeUntil} from 'rxjs';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NotificationType} from 'diflexmo-angular-design';
import {DestroyableComponent} from '../../../../shared/components/destroyable.component';
import {ModalService} from '../../../../core/services/modal.service';
import {PracticeAvailabilityServer} from '../../../../shared/models/practice.model';
import {TimeSlot} from '../../../../shared/models/calendar.model';
import {AddRoomRequestData, Room, RoomType} from '../../../../shared/models/rooms.model';
import {NotificationDataService} from '../../../../core/services/notification-data.service';
import {RoomsApiService} from '../../../../core/services/rooms-api.service';
import {NameValuePairPipe} from '../../../../shared/pipes/name-value-pair.pipe';
import {TimeInIntervalPipe} from '../../../../shared/pipes/time-in-interval.pipe';
import {Status} from '../../../../shared/models/status.model';
import {DUTCH_BE, ENG_BE, Statuses, StatusesNL} from '../../../../shared/utils/const';
import {Translate} from '../../../../shared/models/translate.model';
import {ShareDataService} from 'src/app/core/services/share-data.service';
import {DateTimeUtils} from "../../../../shared/utils/date-time.utils";

interface FormValues {
    name: string;
    description: string;
    type: RoomType;
    placeInAgenda: number;
    placeInAgendaIndex: number;
    practiceAvailabilityToggle: boolean;
}

@Component({
    selector: 'dfm-add-room-modal',
    templateUrl: './add-room-modal.component.html',
    styleUrls: ['./add-room-modal.component.scss'],
})
export class AddRoomModalComponent extends DestroyableComponent implements OnInit, OnDestroy {
    public addRoomForm!: FormGroup;

    public roomAvailabilityData$$ = new BehaviorSubject<PracticeAvailabilityServer[]>([]);

    public room$$ = new BehaviorSubject<Room | undefined>(undefined);

    public submitting$$ = new BehaviorSubject<boolean>(false);

    public emitEvents$$ = new Subject<void>();

    public modalData!: { edit: boolean; roomID: number; placeInAgendaIndex: number };
    public statuses = Statuses;
    private selectedLang: string = ENG_BE;

    constructor(
        private modalSvc: ModalService,
        private fb: FormBuilder,
        private notificationSvc: NotificationDataService,
        private roomApiSvc: RoomsApiService,
        private nameValuePipe: NameValuePairPipe,
        private timeInIntervalPipe: TimeInIntervalPipe,
        private cdr: ChangeDetectorRef,
        private shareDataSvc: ShareDataService,
    ) {
        super();
    }

    public get formValues(): FormValues {
        return this.addRoomForm.value;
    }

    public ngOnInit(): void {
        this.modalSvc.dialogData$
            .pipe(
                switchMap((modalData) => {
                    this.modalData = modalData;
                    if (modalData?.edit && modalData?.roomID) {
                        return this.roomApiSvc.getRoomByID(modalData.roomID);
                    }
                    return of({} as Room);
                }),
                take(1),
            )
            .subscribe((room) => {
                this.room$$.next(room);
                this.createForm(room);
            });

        if (!this.modalData.edit) {
            this.roomApiSvc
                .getRoomByID(0)
                .pipe(take(1))
                .subscribe((room) => {
                    this.addRoomForm.patchValue({placeInAgenda: room.placeInAgenda});
                });
        }

        this.shareDataSvc
            .getLanguage$()
            .pipe(takeUntil(this.destroy$$))
            .subscribe((lang) => {
                this.selectedLang = lang;
                switch (lang) {
                    case ENG_BE:
                        this.statuses = Statuses;
                        break;
                    case DUTCH_BE:
                        this.statuses = StatusesNL;
                        break;
                }
            });
    }

    public override ngOnDestroy() {
        super.ngOnDestroy();
    }

    public toggleAvailabilityForm(toggle: boolean): void {
        //  set practice availability toggle
        this.addRoomForm.get('practiceAvailabilityToggle')?.setValue(toggle, {emitEvent: false});
    }

    public closeModal(res: boolean) {
        this.modalSvc.close(res);
        // this.ngOnDestroy();
    }

    public handle(e: Event) {
    }

    public saveRoom() {
        if (!this.formValues.practiceAvailabilityToggle) {
            this.saveForm();
            return;
        }

        this.emitEvents$$.next();
    }

    public saveForm(timeSlotFormValues?: { isValid: boolean; values: TimeSlot[] }) {
        if (this.addRoomForm.invalid) {
            this.addRoomForm.markAllAsTouched();
            this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
            return;
        }

        if (this.formValues.practiceAvailabilityToggle && timeSlotFormValues && !timeSlotFormValues.isValid) {
            this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
            return;
        }

        this.submitting$$.next(true);

        const {practiceAvailabilityToggle, placeInAgendaIndex, ...rest} = this.formValues;

        const addRoomReqData: AddRoomRequestData = {
            ...rest,
            availabilityType: timeSlotFormValues ? +!!timeSlotFormValues.values?.length : 0,
            practiceAvailability: timeSlotFormValues ? timeSlotFormValues.values : [],
        };

        if (this.modalData?.roomID) {
            addRoomReqData.id = this.modalData.roomID;
        }

        if (this.modalData.edit) {
            this.roomApiSvc
                .editRoom$(addRoomReqData)
                .pipe(takeUntil(this.destroy$$))
                .subscribe(
                    () => {
                        if (this.modalData.edit) {
                            this.notificationSvc.showNotification(Translate.SuccessMessage.RoomsUpdated[this.selectedLang]);
                        } else {
                            this.notificationSvc.showNotification(Translate.SuccessMessage.RoomsAdded[this.selectedLang]);
                        }
                        this.closeModal(true);
                        this.submitting$$.next(false);
                    },
                    () => this.submitting$$.next(false),
                );
        } else {
            this.roomApiSvc
                .addRoom$(addRoomReqData)
                .pipe(takeUntil(this.destroy$$))
                .subscribe(
                    () => {
                        if (this.modalData.edit) {
                            this.notificationSvc.showNotification(Translate.SuccessMessage.RoomsUpdated[this.selectedLang]);
                        } else {
                            this.notificationSvc.showNotification(Translate.SuccessMessage.RoomsAdded[this.selectedLang]);
                        }
                        this.closeModal(true);
                        this.submitting$$.next(false);
                    },
                    () => this.submitting$$.next(false),
                );
        }
    }

    private createForm(roomDetails?: Room | undefined): void {
        this.addRoomForm = this.fb.group({
            name: [roomDetails?.name ?? '', [Validators.required]],
            placeInAgenda: [roomDetails?.placeInAgenda, []],
            placeInAgendaIndex: [{value: null, disabled: true}, [Validators.required]],
            description: [roomDetails?.description ?? '', []],
            type: [roomDetails?.type ?? null, [Validators.required]],
            practiceAvailabilityToggle: [!!roomDetails?.availabilityType, []],
            status: [this.modalData.edit ? roomDetails?.status : Status.Inactive, []],
        });

        setTimeout(() => {
            this.addRoomForm.patchValue({placeInAgendaIndex: this.modalData?.placeInAgendaIndex});
        }, 0);

        if (roomDetails?.practiceAvailability?.length) {
            const practice = [
                ...roomDetails.practiceAvailability.map((availability) => {
                    return {
                        ...availability,
                        dayStart: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayStart),
                        dayEnd: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayEnd),
                    }
                })
            ];
            this.roomAvailabilityData$$.next(practice);
        }
    }
}
