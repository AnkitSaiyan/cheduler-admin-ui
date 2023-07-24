import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {InputComponent, NotificationType} from 'diflexmo-angular-design';
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
	Subject,
	switchMap,
	take,
	takeUntil,
} from 'rxjs';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { TimeSlot } from '../../../../shared/models/calendar.model';
import { UserApiService } from '../../../../core/services/user-api.service';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { RouterStateService } from '../../../../core/services/router-state.service';
import { COMING_FROM_ROUTE, DUTCH_BE, EDIT, ENG_BE, EXAM_ID, BodyType, Statuses, StatusesNL } from '../../../../shared/utils/const';
import { PracticeAvailabilityServer } from '../../../../shared/models/practice.model';
import { Room, RoomsGroupedByType, RoomType } from '../../../../shared/models/rooms.model';
import { CreateExamRequestData, Exam } from '../../../../shared/models/exam.model';
import { RoomsApiService } from '../../../../core/services/rooms-api.service';
import { AvailabilityType, UserType } from '../../../../shared/models/user.model';
import { toggleControlError } from '../../../../shared/utils/toggleControlError';
import { NameValuePairPipe } from '../../../../shared/pipes/name-value-pair.pipe';
import { TimeInIntervalPipe } from '../../../../shared/pipes/time-in-interval.pipe';
import { NameValue } from '../../../../shared/components/search-modal.component';
import { Status } from '../../../../shared/models/status.model';
import { Translate } from '../../../../shared/models/translate.model';
import { ShareDataService } from 'src/app/core/services/share-data.service';
import { GeneralUtils } from '../../../../shared/utils/general.utils';
import { DateTimeUtils } from '../../../../shared/utils/date-time.utils';
import { LoaderService } from 'src/app/core/services/loader.service';

interface FormValues {
	name: string;
	expensive: number;
	bodyType: BodyType;
	bodyPart: string;
	roomType: RoomType;
	roomsForExam: {
		roomId: number;
		duration: number;
		roomName: string;
		selectRoom: boolean;
		sortOrder: number;
	}[];
	info: string;
	instructions: string;
	uncombinables: number[];
	mandatoryStaffs: number[];
	assistantCount: number;
	assistants: number[];
	radiologistCount: number;
	radiologists: number[];
	nursingCount: number;
	nursing: number[];
	secretaryCount: number;
	secretaries: number[];
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

	public examDetails$$ = new BehaviorSubject<Exam | undefined>(undefined);
	public availableRooms$$ = new BehaviorSubject<RoomsGroupedByType>({ private: [], public: [] });
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
	public emitEvents$$ = new Subject<void>();
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
	public bodyType: any[] = [];
	public bodyPart: any[] = [];
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
		private routerStateSvc: RouterStateService,
		private nameValuePipe: NameValuePairPipe,
		private timeInIntervalPipe: TimeInIntervalPipe,
		private cdr: ChangeDetectorRef,
		private shareDataSvc: ShareDataService,
		private loaderSvc: LoaderService,
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

	public get formValues(): FormValues {
		return this.examForm.value;
	}

	public ngOnInit(): void {
		this.shareDataSvc
			.bodyPart$()
			.pipe(
				filter(() => this.edit),
				take(1),
			)
			.subscribe({
				next: (items) => {
					this.bodyPart = items;
					this.filteredBodyPart$$.next(items);
				},
			});
		this.roomApiSvc.fileTypes$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => (this.roomTypes = items),
		});

		this.shareDataSvc.bodyType$.pipe(takeUntil(this.destroy$$)).subscribe({
			next: (items) => (this.bodyType = items),
		});

		this.timings = [...this.nameValuePipe.transform(this.timeInIntervalPipe.transform(this.interval))];
		this.filteredTimings = [...this.timings];

		this.createForm();

		// this.examForm.valueChanges.subscribe(

		this.examApiSvc.allExams$
			.pipe(
				first(),
				map((exams) => exams.filter((exam) => +exam.id !== (+this.examID ?? 0))),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (exams) => {
					this.filteredExams$$.next([...exams.map(({ id, name }) => ({ name, value: id?.toString() }))]);
					this.exams = [...this.filteredExams$$.value];
					this.cdr.detectChanges();
				},
			});

		this.userApiSvc.allStaffs$.pipe(debounceTime(0), takeUntil(this.destroy$$)).subscribe({
			next: (staffs) => {
				const radiologists: NameValue[] = [];
				const assistants: NameValue[] = [];
				const nursing: NameValue[] = [];
				const secretaries: NameValue[] = [];
				const mandatory: NameValue[] = [];

				staffs.forEach((staff) => {
					const nameValue = { name: `${staff.firstname} ${staff.lastname}`, value: staff?.id?.toString() };

					switch (staff.userType) {
						case UserType.Assistant:
							mandatory.push({ ...nameValue });
							assistants.push({ ...nameValue });
							break;
						case UserType.Radiologist:
							mandatory.push({ ...nameValue });
							radiologists.push({ ...nameValue });
							break;
						// case UserType.Scheduler:
						case UserType.Secretary:
							mandatory.push({ ...nameValue });
							secretaries.push({ ...nameValue });
							break;
						case UserType.Nursing:
							mandatory.push({ ...nameValue });
							nursing.push({ ...nameValue });
							break;
						default:
					}
				});

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
			next: (rooms) => this.availableRooms$$.next(rooms),
		});

		this.shareDataSvc
			.getLanguage$()
			.pipe(takeUntil(this.destroy$$))
			.subscribe({
				next: (lang) => {
					this.selectedLang = lang;
					// this.columns = [
					//   Translate.FirstName[lang],
					//   Translate.LastName[lang],
					//   Translate.Email[lang],
					//   Translate.Telephone[lang],
					//   Translate.Category[lang],
					//   Translate.Status[lang],
					//   Translate.Actions[lang],
					// ];

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
					this.examForm.get('name')?.addAsyncValidators(this.examApiSvc.examValidator(+params[EXAM_ID] || '0'));
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

		this.examForm.get('roomsForExam')?.valueChanges.subscribe((value) => {
			const total = value.reduce((acc, curr) => {
				return acc + curr.selectRoom;
			}, 0);
			// (this.examForm.get('roomsForExam') as FormArray).controls.forEach((control) => {
			// 	if (control.value?.sortOrder && control.value?.sortOrder > total) {
			// 		// console.log(control.value?.sortOrder, 'test', this.availableRooms$$.value[this.examForm.value.roomType].length);
			// 		control.get('sortOrder')?.reset();
			// 	}
			// });
			this.orderOption$$.next(total || 1);
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

	public saveExam(): void {
		if (!this.formValues.practiceAvailabilityToggle) {
			this.saveForm();
			return;
		}

		this.emitEvents$$.next();
	}

	public handleExpenseInput(e: Event, element: InputComponent, control: AbstractControl | null | undefined) {
		if (!element.value && element.value < 5) {
			e.preventDefault();
			return;
		}

		if (element.value % 5 !== 0) {
			const newValue = element.value - (element.value % 5);

			element.value = newValue;
			if (control) {
				control.setValue(newValue);
			}
		}
	}

	public saveForm(timeSlotFormValues?: { isValid: boolean; values: TimeSlot[] }) {
		let valid = true;

		if (!this.examForm.valid) {
			['name', 'expensive', 'roomType'].forEach((value) => {
				this.examForm.controls[value].markAsTouched();
			});
			(this.examForm.controls['roomsForExam'] as FormArray).controls.forEach((control) => {
				if (control.get('selectRoom')?.value) {
					control.markAllAsTouched();
				}
			});
			// this.examForm.markAllAsTouched();
			valid = false;
		}

		if (valid && this.formValues.roomsForExam?.every((room) => !room.selectRoom)) {
			this.formErrors.selectRoomErr = true;
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

		if (valid && this.formValues.practiceAvailabilityToggle && timeSlotFormValues && !timeSlotFormValues?.isValid) {
			valid = false;
		}

		if (
			this.formValues.roomsForExam
				.map((value) => value.sortOrder)
				.filter(Boolean)
				.some((value, index, array) => index !== array.findIndex((val) => val === value))
		) {
			valid = false;
		}

		if (!valid) {
			this.notificationSvc.showNotification(Translate.FormInvalid[this.selectedLang], NotificationType.WARNING);
			return;
		}

		this.submitting$$.next(true);

		// const requiredKeys: string[] = ['name', 'expensive', 'roomType'];
		// let valid = true;
		//
		// requiredKeys.forEach((key) => {
		//   if (this.examForm.get(key)?.invalid) {
		//     this.examForm.get(key)?.markAsTouched();
		//     if (valid) {
		//       valid = false;
		//     }
		//   }
		// });

		// let controlArrays!: FormArray[];
		//
		// if (valid) {
		//   controlArrays = this.practiceAvailabilityWeekWiseControlsArray(true);
		//   valid = !this.isPracticeFormInvalid(controlArrays);
		// }
		//

		const createExamRequestData: CreateExamRequestData = {
			name: this.formValues.name,
			bodyType: this.formValues.bodyType,
			bodyPart: this.formValues.bodyPart,
			expensive: this.formValues.expensive,
			info: this.formValues.info ?? null,
			instructions: this.formValues?.instructions ?? null,
			assistantCount: this.formValues.assistantCount ?? 0,
			nursingCount: this.formValues.nursingCount ?? 0,
			radiologistCount: this.formValues.radiologistCount ?? 0,
			secretaryCount: this.formValues.secretaryCount ?? 0,
			mandatoryUsers: [...(this.formValues.mandatoryStaffs ?? [])],
			usersList: [
				...(this.formValues.assistants ?? []),
				...(this.formValues.nursing ?? []),
				...(this.formValues.radiologists ?? []),
				...(this.formValues.secretaries ?? []),
			],
			roomsForExam: [
				...this.formValues.roomsForExam
					.filter((room) => room.selectRoom)
					.map(({ roomId, duration, sortOrder }) => ({
						roomId,
						duration,
						sortOrder,
					})),
			].sort((a, b) => (+a.sortOrder < +b.sortOrder ? -1 : 1)),
			status: this.formValues.status,
			availabilityType: timeSlotFormValues ? +!!timeSlotFormValues?.values?.length : 0,
			uncombinables: this.formValues.uncombinables ?? [],
			practiceAvailability: timeSlotFormValues?.values || [],
		};

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
						let route: string;
						if (this.comingFromRoute === 'view') {
							route = '../view';
						} else {
							route = this.edit ? '/exam' : '../';
						}

						this.submitting$$.next(false);

						this.router.navigate([route], { relativeTo: this.route, queryParamsHandling: 'merge' });
					},
					error: (err) => {
						this.submitting$$.next(false);
						// this.notificationSvc.showNotification(Translate.Error.SomethingWrong[this.selectedLang], NotificationType.DANGER);
					},
				});
		} else {
			this.examApiSvc
				.createExam$(createExamRequestData)
				.pipe(takeUntil(this.destroy$$))
				.subscribe({
					next: () => {
						this.notificationSvc.showNotification(Translate.SuccessMessage.ExamAdded[this.selectedLang]);
						let route: string;
						if (this.comingFromRoute === 'view') {
							route = '../view';
						} else {
							route = this.edit ? '/exam' : '../';
						}

						this.submitting$$.next(false);

						this.router.navigate([route], { relativeTo: this.route, queryParamsHandling: 'merge' });
					},
					error: (err) => {
						this.submitting$$.next(false);
						// this.notificationSvc.showNotification(Translate.Error.SomethingWrong[this.selectedLang], NotificationType.DANGER);
					},
				});
		}
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
			bodyType: [null, [Validators.required]],
			bodyPart: [null, [Validators.required]],
			roomType: [null, [Validators.required]],
			roomsForExam: this.fb.array([]),
			info: [null, []],
			instructions: [null, []],
			uncombinables: [[], []],
			mandatoryStaffs: [[], []],
			assistantCount: [null, []],
			assistants: [[], []],
			radiologistCount: [null, []],
			radiologists: [[], []],
			nursingCount: [null, []],
			nursing: [[], []],
			secretaryCount: [null, []],
			secretaries: [[], []],
			practiceAvailabilityToggle: [false, []],
			status: [Status.Active, []],
		});

		this.examForm
			.get('roomType')
			?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe((roomType) => this.createRoomsForExamFormArray(roomType));

		this.examForm
			.get('bodyType')
			?.valueChanges.pipe(
				debounceTime(0),
				switchMap((bodyType) => this.shareDataSvc.bodyPart$(bodyType)),
				takeUntil(this.destroy$$),
			)
			.subscribe({
				next: (items) => {
					this.bodyPart = items;
					this.filteredBodyPart$$.next(items);
				},
			});

		// this.examDetails$$.pipe(filter(Boolean), takeUntil(this.destroy$$)).subscribe((value) => {
		// 	this.examForm.patchValue({ bodyPart: value.bodyPart });
		// });

		this.examForm
			.get('expensive')
			?.valueChanges.pipe(
				debounceTime(0),
				filter((value) => !!value),
				takeUntil(this.destroy$$),
			)
			.subscribe((value) => this.toggleExpensiveError(+value));

		combineLatest([this.examForm?.get('assistants')?.valueChanges?.pipe(startWith('')), this.examForm?.get('assistantCount')?.valueChanges])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe(() => {
				this.checkStaffCountValidity(this.examForm.get('assistants'), this.examForm.get('assistantCount'), 'assistantCount');
			});

		combineLatest([this.examForm?.get('radiologists')?.valueChanges?.pipe(startWith('')), this.examForm?.get('radiologistCount')?.valueChanges])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe(() => {
				this.checkStaffCountValidity(this.examForm.get('radiologists'), this.examForm.get('radiologistCount'), 'radiologistCount');
			});

		combineLatest([this.examForm?.get('nursing')?.valueChanges?.pipe(startWith('')), this.examForm?.get('nursingCount')?.valueChanges])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe(() => {
				this.checkStaffCountValidity(this.examForm.get('nursing'), this.examForm.get('nursingCount'), 'nursingCount');
			});

		combineLatest([this.examForm?.get('secretaries')?.valueChanges?.pipe(startWith('')), this.examForm?.get('secretaryCount')?.valueChanges])
			.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe(() => {
				this.checkStaffCountValidity(this.examForm.get('secretaries'), this.examForm.get('secretaryCount'), 'secretaryCount');
			});
	}

	private updateForm(examDetails?: Exam): void {
		const assistants: string[] = [];
		const radiologists: string[] = [];
		const nursing: string[] = [];
		const secretaries: string[] = [];
		const mandatory: string[] = [];

		if (examDetails?.users?.length) {
			examDetails.users.forEach((u) => {
				if (u.isMandate) {
					mandatory.push(u.id.toString());
				} else {
					switch (u.userType) {
						case UserType.Assistant:
							assistants.push(u.id.toString());
							break;
						case UserType.Radiologist:
							radiologists.push(u.id.toString());
							break;
						case UserType.Nursing:
							nursing.push(u.id.toString());
							break;
						case UserType.Secretary:
							secretaries.push(u.id.toString());
							break;
						default:
					}
				}
			});
		}

		this.examForm.patchValue({
			name: examDetails?.name,
			expensive: examDetails?.expensive,
			bodyPart: examDetails?.bodyPart,
			practiceAvailabilityToggle: !!examDetails?.practiceAvailability?.length,
			status: this.edit ? +!!examDetails?.status : Status.Active,
			info: examDetails?.info,
			instructions: examDetails?.instructions,
			assistantCount: examDetails?.assistantCount?.toString() ?? '0',
			radiologistCount: examDetails?.radiologistCount?.toString() ?? '0',
			nursingCount: examDetails?.nursingCount?.toString() ?? '0',
			secretaryCount: examDetails?.secretaryCount?.toString() ?? '0',
			assistants,
			nursing,
			secretaries,
			radiologists,
			mandatoryStaffs: mandatory,
			uncombinables: [...(examDetails?.uncombinables?.map((u) => u?.toString()) || [])],
		});
		this.examForm.patchValue({ bodyType: examDetails?.bodyType }, { onlySelf: true, emitEvent: false });

		if (examDetails?.roomsForExam?.length) {
			this.roomApiSvc
				.getRoomByID(examDetails.roomsForExam[0].roomId)
				.pipe(takeUntil(this.destroy$$))
				.subscribe((room) => {
					this.examForm.get('roomType')?.setValue(room?.type);
					this.cdr.detectChanges();
				});
		}

		// setTimeout(() => {
		//   this.examForm.patchValue({
		//     name: examDetails?.name,
		//     expensive: examDetails?.expensive,
		//     practiceAvailabilityToggle: !!examDetails?.practiceAvailability?.length,
		//     status: this.edit ? +!!examDetails?.status : Status.Active,
		//     info: examDetails?.info,
		//     assistantCount: examDetails?.assistantCount?.toString() ?? '0',
		//     radiologistCount: examDetails?.radiologistCount?.toString() ?? '0',
		//     nursingCount: examDetails?.nursingCount?.toString() ?? '0',
		//     secretaryCount: examDetails?.secretaryCount?.toString() ?? '0',
		//     assistants,
		//     nursing,
		//     secretaries,
		//     radiologists,
		//     mandatoryStaffs: mandatory,
		//     uncombinables: [...(examDetails?.uncombinables?.map((u) => u?.toString()) || [])],
		//   });

		//

		//   this.cdr.detectChanges();
		// }, 500);
	}

	private getRoomsForExamFormGroup(room: Room): FormGroup {
		let roomForExam;

		if (this.examDetails$$.value?.roomsForExam?.length) {
			roomForExam = this.examDetails$$.value?.roomsForExam.find((examRoom) => examRoom?.roomId?.toString() === room?.id?.toString());
		}

		const fg = this.fb.group({
			roomId: [room.id, []],
			duration: [
				{
					value: roomForExam?.duration ?? null,
					disabled: !roomForExam?.duration,
				},
				[Validators.required, Validators.min(1)],
			],
			sortOrder: [
				{
					value: roomForExam?.sortOrder ?? null,
					disabled: !roomForExam?.duration,
				},
				[Validators.required],
			],
			roomName: [room.name, []],
			selectRoom: [!!roomForExam?.duration, []],
		});

		fg.get('selectRoom')
			?.valueChanges.pipe(takeUntil(this.destroy$$))
			.subscribe((value) => {
				if (value) {
					fg.get('duration')?.enable();
					fg.get('sortOrder')?.enable();
					this.formErrors.selectRoomErr = false;
				} else {
					this.updateSortOrder(fg.value?.roomId, fg.value?.sortOrder);
					fg.patchValue({
						duration: null,
						sortOrder: null,
					});

					fg.get('duration')?.disable();
					fg.get('sortOrder')?.disable();
				}
			});

		fg.get('duration')
			?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$))
			.subscribe(() => this.toggleExpensiveError(+this.formValues.expensive));

		return fg;
	}

	private updateSortOrder(id: number | null | undefined, sortOrder: number) {
		if (id && sortOrder) {
			const fa = this.examForm.get('roomsForExam') as FormArray;

			fa.controls.forEach((control) => {
				// eslint-disable-next-line no-unsafe-optional-chaining
				if (+control.value?.roomId !== +id && control.value.sortOrder && +control.value.sortOrder > sortOrder) {
					control.patchValue({ sortOrder: (+control.value.sortOrder - 1).toString() });
				}
			});
		}
	}

	private createRoomsForExamFormArray(roomType: RoomType) {
		const fa = this.examForm.get('roomsForExam') as FormArray;

		fa.clear();

		if (this.availableRooms$$.value[roomType]?.length) {
			this.availableRooms$$.value[roomType].forEach((room) => fa.push(this.getRoomsForExamFormGroup(room)));
			// this.orderOption$$.next(this.availableRooms$$.value[roomType].length);

			setTimeout(() => {
				fa.controls.forEach((control) => {
					const room: any = this.availableRooms$$.value[roomType].find((room) => +room.id === +control.value.roomId);
					if (control.get('selectRoom')?.value && room) {
						control.get('sortOrder')?.setValue(control.value.sortOrder.toString());
					}
				});
			}, 0);
		}

		this.cdr.detectChanges();
	}

	private toggleExpensiveError(expensive: number) {
		let totalRoomExpensive = 0;
		let validInput = false;

		this.formValues.roomsForExam.forEach((room) => {
			if (room.selectRoom && +room.duration) {
				totalRoomExpensive += +room.duration;
				validInput = true;
			}
		});

		if (!validInput) {
			return;
		}

		this.formErrors.expensiveErr = totalRoomExpensive !== expensive;
	}

	private checkStaffCountValidity(control: AbstractControl | null, countControl: AbstractControl | null, errorName: string) {
		if (!countControl?.value || (countControl.value && Number.isNaN(+countControl.value))) {
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
