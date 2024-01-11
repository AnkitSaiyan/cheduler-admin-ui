import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputComponent, NotificationType } from 'diflexmo-angular-design';
import {
	BehaviorSubject,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	first,
	map,
	of,
	startWith,
	switchMap,
	take,
	takeUntil,
} from 'rxjs';
import { BodyPartService } from 'src/app/core/services/body-part.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { PracticeHoursApiService } from 'src/app/core/services/practice-hours-api.service';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { TimeSlotUtils } from 'src/app/shared/utils/time-slots.utils';
import { UserUtils } from 'src/app/shared/utils/user.utils';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { TimeSlot } from '../../../../shared/models/calendar.model';
import { CreateExamRequestData, Exam, ResourceBatch } from '../../../../shared/models/exam.model';
import { PracticeAvailabilityServer } from '../../../../shared/models/practice.model';
import { RoomType, RoomsGroupedByType } from '../../../../shared/models/rooms.model';
import { Status } from '../../../../shared/models/status.model';
import { Translate } from '../../../../shared/models/translate.model';
import { AvailabilityType } from '../../../../shared/models/user.model';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { BodyType, COMING_FROM_ROUTE, DUTCH_BE, EDIT, ENG_BE, EXAM_ID, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { GeneralUtils } from '../../../../shared/utils/general.utils';
import { toggleControlError } from '../../../../shared/utils/toggleControlError';

interface FormValues {
	name: string;
	expensive: number;
	bodyType: string[];
	bodyPart: string[] | number[];
	roomType: RoomType;
	roomsForExam: {
		batchName: string;
		roomId: number[];
		duration: number;
		roomName: string[];
		selectRoom: boolean;
		sortOrder: number;
		assistantCount: number;
		assistants: number[];
		radiologistCount: number;
		radiologists: number[];
		nursingCount: number;
		nursing: number[];
		secretaryCount: number;
		secretaries: number[];
		mandatoryStaffs: number[];
	}[];
	info: string;
	instructions: string;
	uncombinables: number[];
	practiceAvailabilityToggle?: boolean;
	status: Status;
}

@Component({
	selector: 'dfm-add-exam',
	templateUrl: './add-exam.component.html',
	styleUrls: ['./add-exam.component.scss'],
})
export class AddExamComponent extends DestroyableComponent implements OnInit, OnDestroy {
	public examForm!: FormGroup;

	public panelOpenState = false;

	public examDetails$$ = new BehaviorSubject<Exam | undefined>(undefined);

	public availableRooms$$ = new BehaviorSubject<RoomsGroupedByType>({ private: [], public: [] });

	public availableRoomsOption$$ = new BehaviorSubject<RoomsGroupedByType>({ private: [], public: [] });

	public loading$$ = new BehaviorSubject(false);

	public submitting$$ = new BehaviorSubject(false);

	public filteredAssistants$$ = new BehaviorSubject<NameValue[]>([]);

	public filteredNursing$$ = new BehaviorSubject<NameValue[]>([]);

	public filteredRadiologists$$ = new BehaviorSubject<NameValue[]>([]);

	public filteredSecretaries$$ = new BehaviorSubject<NameValue[]>([]);

	public filteredMandatoryStaffs$$ = new BehaviorSubject<NameValue[]>([]);

	public filteredExams$$ = new BehaviorSubject<NameValue[]>([]);

	public filteredBodyPart$$ = new BehaviorSubject<NameValue[]>([]);

	public examAvailabilityData$$ = new BehaviorSubject<PracticeAvailabilityServer[]>([]);

	public practiceHourData$$ = new BehaviorSubject<PracticeAvailabilityServer[]>([]);

	public orderOption$$ = new BehaviorSubject<number>(0);

	public comingFromRoute = '';

	public edit = false;

	public statuses = Statuses;

	public formErrors = {
		selectRoomErr: false,
		expensiveErr: false,
	};

	public readonly interval: number = 5;

	public examID!: string;

	public roomTypes: any[] = [];

	public bodyType: NameValue[] = [];

	public bodyPart: NameValue[] = [];

	public timings: NameValue[] = [];

	public filteredTimings: NameValue[] = [];

	private selectedLang: string = ENG_BE;

	private assistants: NameValue[] = [];

	private nursing: NameValue[] = [];

	private radiologists: NameValue[] = [];

	private secretaries: NameValue[] = [];

	private mandatoryStaffs: NameValue[] = [];

	private exams: NameValue[] = [];

	constructor(
		private fb: FormBuilder,
		private userApiSvc: UserApiService,
		private examApiSvc: ExamApiService,
		private roomApiSvc: RoomsApiService,
		private notificationSvc: NotificationDataService,
		private router: Router,
		private route: ActivatedRoute,
		private nameValuePipe: NameValuePairPipe,
		private timeInIntervalPipe: TimeInIntervalPipe,
		private cdr: ChangeDetectorRef,
		private shareDataSvc: ShareDataService,
		private loaderSvc: LoaderService,
		private practiceHourApiSvc: PracticeHoursApiService,
		private bodyPartSvc: BodyPartService,
	) {
		super();
		const state = this.router.getCurrentNavigation()?.extras?.state;
		if (state !== undefined) {
			this.loading$$.next(true);
			this.comingFromRoute = state[COMING_FROM_ROUTE];
			this.edit = state[EDIT];

			localStorage.setItem(COMING_FROM_ROUTE, this.comingFromRoute);
			if (typeof this.edit === 'boolean') {
				localStorage.setItem(EDIT, this.edit.toString());
			}
		} else {
			this.loading$$.next(true);
			this.getStateFromLocalStorage();
		}
		this.loaderSvc.activate();
	}

	public get roomsForExamControls(): AbstractControl[] {
		return (this.examForm.get('roomsForExam') as FormArray)?.controls;
	}

	public get roomsForExam(): FormArray {
		return this.examForm.get('roomsForExam') as FormArray;
	}

	public get formValues(): FormValues {
		return this.examForm.value;
	}

	public ngOnInit(): void {
		this.setBodyType(this.nameValuePipe.transform(this.bodyPartSvc.commonBodyPart, 'bodypartName', 'id'));

		this.roomApiSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => (this.roomTypes = items),
		});

		this.shareDataSvc.bodyType$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => (this.bodyType = items),
		});

		this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(this.interval))];
		this.filteredTimings = [...this.timings];

		this.createForm();

		this.examApiSvc.allExams$
			.pipe(
				first(),
				map((exams) => exams.filter((exam) => +exam.id !== +(this.examID ?? 0))),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (exams) => {
					this.filteredExams$$.next([...exams.map(({ id, name }) => ({ name, value: id?.toString() }))]);
					this.exams = [...this.filteredExams$$.value];
					this.cdr.detectChanges();
				},
			});

		this.examForm
			.get('expensive')
			?.valueChanges.pipe(takeUntil(this.destroy$$))
			.subscribe((value) => this.toggleExpensiveError(+value));

		this.userApiSvc.allStaffs$.pipe(debounceTime(0), takeUntil(this.destroy$$)).subscribe({
			next: (staffs) => {
				const { radiologists, assistants, nursing, secretaries, mandatory } = UserUtils.GroupUsersByType(staffs, true, true);

				this.filteredRadiologists$$.next([...radiologists]);
				this.filteredAssistants$$.next([...assistants]);
				this.filteredNursing$$.next([...nursing]);
				this.filteredSecretaries$$.next([...secretaries]);
				this.filteredMandatoryStaffs$$.next([...mandatory]);

				this.mandatoryStaffs = [...mandatory];
				this.assistants = [...assistants];
				this.nursing = [...nursing];
				this.secretaries = [...secretaries];
				this.radiologists = [...radiologists];

				this.cdr.detectChanges();
			},
		});

		this.roomApiSvc
			.getRoomTypes()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (roomTypes) => (this.roomTypes = [...roomTypes]),
			});

		this.roomApiSvc.roomsGroupedByType$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (rooms) => {
				this.availableRooms$$.next(rooms);
				this.availableRoomsOption$$.next({
					private: rooms.private?.map((room) => ({ ...room, value: room.id })),
					public: rooms.public?.map((room) => ({ ...room, value: room.id })),
				});
			},
		});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => {
					this.selectedLang = lang;
					// eslint-disable-next-line default-case
					switch (lang) {
						case ENG_BE:
							this.statuses = Statuses;
							break;
						case DUTCH_BE:
							this.statuses = StatusesNL;
							break;
					}
				},
			});

		this.route.params
			.pipe(
				filter((params) => {
					this.examForm.get('name')?.addAsyncValidators(this.examApiSvc.examValidator(+params[EXAM_ID] && this.edit ? +params[EXAM_ID] : '0'));
					this.examForm.updateValueAndValidity();
					return params[EXAM_ID];
				}),
				map((params) => params[EXAM_ID]),
				switchMap((examID) => {
					if (examID) {
						this.examID = examID;
						return this.examApiSvc.getExamByID(+examID);
					}
					return of({} as Exam);
				}),
				debounceTime(500),
				take(1),
			)
			.subscribe({
				next: (examDetails) => {
					if (examDetails) {
						this.updateForm(examDetails);
						if (examDetails?.practiceAvailability?.length) {
							const practice = [
								...examDetails.practiceAvailability.map((availability) => {
									return {
										...availability,
										dayStart: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayStart),
										dayEnd: DateTimeUtils.UTCTimeToLocalTimeString(availability.dayEnd),
									};
								}),
							];
							this.examAvailabilityData$$.next(practice);
						}
					}
					this.loading$$.next(false);
					this.examDetails$$.next(examDetails);
				},
			});

		this.practiceHourApiSvc.practiceHoursWithTimeConversion$.pipe(take(1)).subscribe((practiceHours) => {
			this.practiceHourData$$.next(practiceHours);
		});

		this.examForm.get('roomsForExam')?.valueChanges.subscribe((value) => {
			this.orderOption$$.next(value.length || 1);
		});
	}

	public override ngOnDestroy() {
		super.ngOnDestroy();
		localStorage.removeItem(COMING_FROM_ROUTE);
		localStorage.removeItem(EDIT);
	}

	public handleRadioButtonChange(toggle: boolean): void {
		//  set practice availability toggle
		this.examForm.patchValue({ practiceAvailabilityToggle: toggle }, { emitEvent: false });
	}

	public handleExpenseInput(e: Event, element: InputComponent, control: AbstractControl | null | undefined) {
		const htmlElement: InputComponent = element;
		if (!element.value && element.value < 5) {
			e.preventDefault();
			return;
		}

		if (element.value % 5 !== 0) {
			const newValue = element.value - (element.value % 5);

			htmlElement.value = newValue;
			if (control) {
				control.setValue(newValue);
			}
		}
	}

	public saveForm() {
		let timeSlotFormValues: TimeSlot[] = [];
		if (this.formValues.practiceAvailabilityToggle) {
			timeSlotFormValues = TimeSlotUtils.getFormRequestBody(this.examForm?.get('timeSlotForm')?.value);
		}

		const valid = this.isFormValid();

		if (!valid) {
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			return;
		}

		this.submitting$$.next(true);

		const createExamRequestData: CreateExamRequestData = this.requestData(timeSlotFormValues);

		this.saveDataToBackend(createExamRequestData);
	}

	private isFormValid(): boolean {
		let valid: boolean = true;

		if (!this.examForm.valid) {
			this.examForm.markAllAsTouched();
			valid = false;
		}

		if (this.formErrors.expensiveErr) {
			valid = false;
		}

		if (valid) {
			(this.examForm.get('roomsForExam') as FormArray).controls.forEach((control) => {
				if (control.get('duration')?.invalid) {
					control.get('duration')?.markAsTouched();
					if (valid) {
						valid = false;
					}
				}
			});
		}

		if (
			this.formValues.roomsForExam
				.map((value) => value.sortOrder)
				.filter(Boolean)
				.some((value, index, array) => index !== array.findIndex((val) => val === value))
		) {
			valid = false;
		}

		return valid;
	}

	private requestData(timeSlotFormValues: TimeSlot[]): CreateExamRequestData {
		return {
			name: this.formValues.name,
			bodyType: this.formValues.bodyType.join(','),
			bodyPart: this.formValues.bodyPart,
			expensive: this.formValues.expensive,
			info: this.formValues.info ?? null,
			instructions: this.formValues?.instructions ?? null,
			resourcesBatch: [
				...this.formValues.roomsForExam.map(
					(
						{
							batchName,
							roomName,
							duration,
							sortOrder,
							assistantCount,
							nursingCount,
							radiologistCount,
							secretaryCount,
							mandatoryStaffs,
							assistants,
							nursing,
							radiologists,
							secretaries,
						},
						index,
					) => ({
						batchName: batchName?.length ? batchName : `Room ${index + 1}`,
						roomduration: +duration,
						roomOrder: +sortOrder,
						roomList: roomName,
						assistantCount: +(assistantCount ?? 0),
						nursingCount: +(nursingCount ?? 0),
						radiologistCount: +(radiologistCount ?? 0),
						secretaryCount: +(secretaryCount ?? 0),
						mandatoryUsers: [...(mandatoryStaffs?.map((value) => +value) ?? [])],
						userList: [
							...(assistants?.map((value) => +value) ?? []),
							...(nursing?.map((value) => +value) ?? []),
							...(radiologists?.map((value) => +value) ?? []),
							...(secretaries?.map((value) => +value) ?? []),
						],
					}),
				),
			]?.sort((a, b) => (+a.roomOrder < +b.roomOrder ? -1 : 1)),
			status: this.formValues.status,
			availabilityType: timeSlotFormValues ? +!!timeSlotFormValues?.length : 0,
			uncombinables: this.formValues.uncombinables?.map((value) => +value) ?? [],
			practiceAvailability: timeSlotFormValues,
		};
	}

	private saveDataToBackend(createExamRequestData: CreateExamRequestData) {
		if (this.examDetails$$.value?.id) {
			createExamRequestData.id = this.examDetails$$.value?.id;
		}

		if (!createExamRequestData.practiceAvailability?.length) {
			createExamRequestData.availabilityType = AvailabilityType.Unavailable;
		}
		if (this.edit) {
			this.examApiSvc
				.updateExam$(createExamRequestData)
				.pipe(takeUntil(this.destroy$$))
				.subscribe({
					next: () => {
						this.notificationSvc.showNotification(Translate.SuccessMessage.ExamUpdated[this.selectedLang]);
						this.navigationAfterSave();
					},
					error: () => {
						this.submitting$$.next(false);
					},
				});
		} else {
			this.examApiSvc
				.createExam$(createExamRequestData)
				.pipe(takeUntil(this.destroy$$))
				.subscribe({
					next: () => {
						this.notificationSvc.showNotification(Translate.SuccessMessage.ExamAdded[this.selectedLang]);
						this.navigationAfterSave();
					},
					error: () => {
						this.submitting$$.next(false);
					},
				});
		}
	}

	private navigationAfterSave() {
		let route: string;

		if (this.comingFromRoute === 'view') {
			route = '../view';
		} else {
			route = this.edit ? '/exam' : '../';
		}

		this.submitting$$.next(false);

		this.router.navigate([route], { relativeTo: this.route, queryParamsHandling: 'merge' });
	}

	public handleDropdownSearch(searchText: string, type: 'mandatory' | 'radio' | 'nursing' | 'assistant' | 'secretary' | 'exam' | 'bodyPart'): void {
		switch (type) {
			case 'mandatory':
				this.filteredMandatoryStaffs$$.next(GeneralUtils.FilterArray(this.mandatoryStaffs, searchText, 'name'));
				break;
			case 'radio':
				this.filteredRadiologists$$.next(GeneralUtils.FilterArray(this.radiologists, searchText, 'name'));
				break;
			case 'nursing':
				this.filteredNursing$$.next(GeneralUtils.FilterArray(this.nursing, searchText, 'name'));
				break;
			case 'secretary':
				this.filteredSecretaries$$.next(GeneralUtils.FilterArray(this.secretaries, searchText, 'name'));
				break;
			case 'assistant':
				this.filteredAssistants$$.next(GeneralUtils.FilterArray(this.assistants, searchText, 'name'));
				break;
			case 'exam':
				this.filteredExams$$.next(GeneralUtils.FilterArray(this.exams, searchText, 'name'));
				break;
			case 'bodyPart':
				this.filteredBodyPart$$.next(GeneralUtils.FilterArray(this.bodyPart, searchText, 'name'));
				break;
			default:
		}
	}

	private getStateFromLocalStorage() {
		const comingFromRoute = localStorage.getItem(COMING_FROM_ROUTE);
		if (comingFromRoute) {
			this.comingFromRoute = comingFromRoute;
		}
		const edit = localStorage.getItem(EDIT);
		if (edit) {
			this.edit = edit === 'true';
		}
	}

	private createForm(): void {
		this.examForm = this.fb.group({
			name: [null, [Validators.required]],
			// name: [null, [Validators.required]],
			expensive: [null, [Validators.required, Validators.min(5)]],
			bodyType: [[BodyType.Male, BodyType.Female], [Validators.required]],
			bodyPart: [null, [Validators.required]],
			roomType: [null, [Validators.required]],
			roomsForExam: this.fb.array([]),
			info: [null, []],
			instructions: [null, []],
			uncombinables: [[], []],
			practiceAvailabilityToggle: [false, []],
			status: [Status.Active, []],
		});

		this.examForm
			.get('roomType')
			?.valueChanges.pipe(debounceTime(0), distinctUntilChanged(), takeUntil(this.destroy$$))
			.subscribe(() => {
				this.createRoomsForExamFormArray();
			});

		this.examForm
			.get('bodyType')
			?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe({
				next: (items) => {
					switch (items?.length) {
						case 0: {
							this.setBodyType([]);
							break;
						}
						case 1: {
							this.setBodyType(this.nameValuePipe.transform(this.bodyPartSvc.getBodyPartByType(items?.[0]), 'bodypartName', 'id'));
							break;
						}
						default:
							this.setBodyType(this.nameValuePipe.transform(this.bodyPartSvc.commonBodyPart, 'bodypartName', 'id'));
							break;
					}
				},
			});
	}

	private setBodyType(bodyParts: NameValue[]) {
		this.bodyPart = bodyParts;
		this.filteredBodyPart$$.next(bodyParts);
	}

	private updateForm(examDetails?: Exam): void {
		this.examForm.patchValue({
			name: examDetails?.name,
			expensive: examDetails?.expensive,
			bodyPart: examDetails?.bodyPartDetails?.map(({ id }) => id.toString()),
			practiceAvailabilityToggle: !!examDetails?.practiceAvailability?.length,
			status: this.edit ? +!!examDetails?.status : Status.Active,
			info: examDetails?.info,
			instructions: examDetails?.instructions,
			uncombinables: [...(examDetails?.uncombinables?.map((u) => u?.toString()) ?? [])],
		});

		this.examForm.patchValue({ bodyType: examDetails?.bodyType?.split(',') }, { onlySelf: true, emitEvent: false });

		if (examDetails?.resourcesBatch?.length) {
			this.roomApiSvc
				.getRoomByID(examDetails.resourcesBatch[0].rooms[0].id)
				.pipe(takeUntil(this.destroy$$))
				.subscribe((room) => {
					this.examForm.get('roomType')?.setValue(room?.type, { emitEvent: false });

					this.cdr.detectChanges();

					const fa = this.examForm.get('roomsForExam') as FormArray;

					setTimeout(() => {
						fa.clear();
						examDetails.resourcesBatch.forEach((batch) => {
							fa.push(this.addRoomForm(batch));
						});
					}, 100);
				});
		}
	}

	private addRoomForm(batch?: ResourceBatch): FormGroup {
		const roomsByType = this.availableRoomsOption$$.value[this.examForm.value.roomType];

		const fg = this.fb.group({
			formId: [Math.floor(Math.random() * 100000)],
			duration: [batch?.roomDuration, [Validators.required]],
			sortOrder: [null, [Validators.required]],
			roomName: [[], [Validators.required]],
			selectRoom: [null, []],
			batchName: [batch?.batchName ?? '', []],
			assistantCount: [null, []],
			assistants: [[], []],
			radiologistCount: [null, []],
			radiologists: [[], []],
			nursingCount: [null, []],
			nursing: [[], []],
			secretaryCount: [null, []],
			secretaries: [[], []],
			mandatoryStaffs: [[], []],
			filteredRooms: [[...roomsByType]],
		});

		if (batch) {
			this.updateFormValues(batch, fg);
		}

		this.handleFormSubscriptions(fg);

		return fg;
	}

	private updateFormValues(batch: ResourceBatch, fg: FormGroup) {
		const { assistants, mandatory, nursing, radiologists, secretaries } = UserUtils.GroupUsersByType(batch?.users ?? [], false, false, true);
		setTimeout(() => {
			fg.patchValue({
				roomName: batch?.rooms.map(({ id }) => id),
				sortOrder: batch?.roomOrder.toString(),
				assistantCount: batch?.assistantCount?.toString() ?? '0',
				batchName: batch?.batchName ?? '',
				radiologistCount: batch?.radiologistCount?.toString() ?? '0',
				nursingCount: batch?.nursingCount?.toString() ?? '0',
				secretaryCount: batch?.secretaryCount?.toString() ?? '0',
				assistants,
				nursing,
				secretaries,
				radiologists,
				mandatoryStaffs: mandatory,
			} as any);
		}, 100);
	}

	private handleFormSubscriptions(fg: FormGroup) {
		combineLatest([fg?.get('assistants')?.valueChanges.pipe(startWith('')) ?? [], fg?.get('assistantCount')?.valueChanges ?? []])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe(() => {
				this.checkStaffCountValidity(fg.get('assistants'), fg.get('assistantCount'), 'assistantCount');
			});

		combineLatest([fg?.get('radiologists')?.valueChanges?.pipe(startWith('')) ?? [], fg?.get('radiologistCount')?.valueChanges ?? []])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe(() => {
				this.checkStaffCountValidity(fg.get('radiologists'), fg.get('radiologistCount'), 'radiologistCount');
			});

		combineLatest([fg?.get('nursing')?.valueChanges?.pipe(startWith('')) ?? [], fg?.get('nursingCount')?.valueChanges ?? []])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe(() => {
				this.checkStaffCountValidity(fg.get('nursing'), fg.get('nursingCount'), 'nursingCount');
			});

		combineLatest([fg?.get('secretaries')?.valueChanges?.pipe(startWith('')) ?? [], fg?.get('secretaryCount')?.valueChanges ?? []])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe(() => {
				this.checkStaffCountValidity(fg.get('secretaries'), fg.get('secretaryCount'), 'secretaryCount');
			});

		fg.get('duration')
			?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe({
				next: () => this.toggleExpensiveError(+this.formValues.expensive),
			});

		fg.get('roomName')
			?.valueChanges?.pipe(
				debounceTime(10),
				distinctUntilChanged((pre: any, curr: any) => {
					if (pre?.length !== curr?.length) return false;
					const roomIdSet = new Set(pre);
					return curr.every((id) => roomIdSet.has(id));
				}),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: () => {
					this.filterBatchRooms();
				},
			});
	}

	public filterBatchRooms(): void {
		const roomsByType = this.availableRoomsOption$$.value[this.examForm.value?.roomType] || [];

		this.roomsForExamControls.forEach((control) => {
			const roomIDsSet = new Set<string | number>(
				this.roomsForExamControls
					.filter((currControl) => currControl.value.formId !== control.value.formId)
					.flatMap((currControl) => currControl.value.roomName || []),
			);

			control.get('filteredRooms')?.setValue(
				roomsByType.filter((room: NameValue) => !roomIDsSet.has(room.value)),
				{ emitEvent: false },
			);
		});
	}

	public addMoreRoomForm() {
		const fa = this.examForm.get('roomsForExam') as FormArray;
		let batchName!: string;
		const examDetails = this.examDetails$$.value;
		if (examDetails) {
			const lastBatchName = fa.value?.[fa.value?.length - 1].batchName;
			const lastBatchNameCount = lastBatchName.split(' ').at(-1)!;
			batchName = `Room ${+lastBatchNameCount + 1}`;
		}
		const fg = this.addRoomForm({ batchName } as ResourceBatch);
		fa.push(fg);
		this.filterBatchRooms();
	}

	public removeRoomForm(index: number) {
		const fa = this.examForm.get('roomsForExam') as FormArray;
		fa.removeAt(index);
		this.filterBatchRooms();
		this.toggleExpensiveError(this.formValues.expensive);
	}

	private createRoomsForExamFormArray() {
		const fa = this.examForm.get('roomsForExam') as FormArray;
		fa.clear();
		fa.push(this.addRoomForm());
		this.cdr.detectChanges();
	}

	private toggleExpensiveError(expensive: number) {
		let totalRoomExpensive = 0;
		let validInput = false;

		this.formValues.roomsForExam.forEach((room) => {
			totalRoomExpensive += +room.duration;
			validInput = true;
		});

		if (!validInput) {
			return;
		}

		this.formErrors.expensiveErr = totalRoomExpensive !== expensive;
	}

	private checkStaffCountValidity(control: AbstractControl | null, countControl: AbstractControl | null, errorName: string) {
		if (!countControl?.value || (countControl.value && isNaN(+countControl.value))) {
			return;
		}

		// (+countControl.value === 0 && control?.value?.length > 0)
		if (control?.value?.length < +countControl.value) {
			toggleControlError(control, errorName);
			return;
		}

		toggleControlError(control, errorName, false);
	}
}
