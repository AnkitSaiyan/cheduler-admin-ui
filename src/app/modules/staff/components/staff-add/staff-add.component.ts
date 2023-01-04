import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, distinctUntilChanged, filter, map, takeUntil } from 'rxjs';
import { NotificationType } from 'diflexmo-angular-design';
import { ActivatedRoute, Router } from '@angular/router';
import { UserType } from '../../../../shared/models/user.model';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ExamApiService } from '../../../../core/services/exam-api.service';
import { UserApiService } from '../../../../core/services/user-api.service';
import { Weekday } from '../../../../shared/models/weekday';
import { NotificationDataService } from '../../../../core/services/notification-data.service';
import { AddStaffRequestData } from '../../../../shared/models/staff.model';
import { StaffApiService } from '../../../../core/services/staff-api.service';
import { PracticeAvailability } from '../../../../shared/models/practice.model';

interface FormValues {
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  address: string;
  userType: UserType;
  practiceAvailabilityToggle?: boolean;
  practiceAvailability: {
    [key: string]: {
      weekday: Weekday;
      dayStart: Date;
      dayEnd: Date;
    }[];
  };

  examLists: number[];
  selectedWeekday: Weekday;
  info: string;
}

@Component({
  selector: 'dfm-staff-add',
  templateUrl: './staff-add.component.html',
  styleUrls: ['./staff-add.component.scss'],
})
export class StaffAddComponent extends DestroyableComponent implements OnInit, AfterViewInit {
  @ViewChild('dropdown') private eleRef!: ElementRef;

  public addStaffForm!: FormGroup;

  public exams$$ = new BehaviorSubject<any[]>([]);

  public generalUserTypes$$ = new BehaviorSubject<any[]>([]);

  public weekday = Weekday;

  constructor(
    private fb: FormBuilder,
    private userApiSvc: UserApiService,
    private examApiSvc: ExamApiService,
    private notificationSvc: NotificationDataService,
    private staffApiSvc: StaffApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    super();
  }

  public ngAfterViewInit() {
    console.log(this.eleRef);
  }

  public ngOnInit(): void {
    this.createForm();

    this.userApiSvc.generalUserTypes.pipe(takeUntil(this.destroy$$)).subscribe((generalUserTypes) => {
      this.generalUserTypes$$.next(generalUserTypes);
    });

    this.examApiSvc.exams$
      .pipe(
        map((exams) => exams.map(({ name, id }) => ({ name, value: id }))),
        takeUntil(this.destroy$$),
      )
      .subscribe((exams) => {
        this.exams$$.next(exams);
      });

    this.addStaffForm
      .get('practiceAvailabilityToggle')
      ?.valueChanges.pipe(
        filter((value: boolean) => value),
        distinctUntilChanged(),
        takeUntil(this.destroy$$),
      )
      .subscribe(() => this.addPracticeAvailabilityControls());
  }

  private createForm(): void {
    this.addStaffForm = this.fb.group({
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      email: ['', [Validators.required]],
      telephone: ['', [Validators.required]],
      userType: ['', [Validators.required]],
      info: ['', []],
      examLists: [[], [Validators.required]],
      selectedWeekday: [this.weekday.ALL, []],
      practiceAvailabilityToggle: [false, []],
      practiceAvailability: this.fb.group({}),
    });
  }

  private getPracticeAvailabilityFormGroup(weekday?: Weekday): FormGroup {
    const fg = this.fb.group({
      weekday: [weekday ?? this.formValues.selectedWeekday, []],
      dayStart: ['', []],
      dayEnd: ['', []],
    });
    return fg;
  }

  private addPracticeAvailabilityControls(): void {
    const fg = this.addStaffForm.get('practiceAvailability') as FormGroup;
    switch (this.formValues.selectedWeekday) {
      case Weekday.ALL:
        Object.values(this.weekday).forEach((day) => {
          if (typeof day === 'number' && day > 0) {
            const fa = fg.get(day.toString()) as FormArray;
            if (!fa || !fa.length) {
              fg.addControl(day.toString(), this.fb.array([this.getPracticeAvailabilityFormGroup(day)]));
            }
          }
        });
        break;
      default:
        if (!Object.keys(fg.value)?.length || (Object.keys(fg.value).length && !fg.get(this.formValues.selectedWeekday.toString()))) {
          fg.addControl(this.formValues.selectedWeekday.toString(), this.fb.array([this.getPracticeAvailabilityFormGroup()]));
        }
    }
  }

  public get practiceAvailabilityControlsArray(): FormArray[] {
    const controls: FormArray[] = [];

    const fg = this.addStaffForm.get('practiceAvailability');
    const { selectedWeekday } = this.formValues;
    const keys = Object.keys(this.formValues.practiceAvailability).filter(
      (key) => key === selectedWeekday.toString() || selectedWeekday === Weekday.ALL,
    );

    if (keys?.length) {
      keys.forEach((key) => {
        const fa = fg?.get(key) as FormArray;
        if (fa?.length) {
          controls.push(fg?.get(key) as FormArray);
        }
      });
    }
    return controls;
  }

  public get formValues(): FormValues {
    return this.addStaffForm.value;
  }

  public getFormArrayName(controlArray: FormArray): Weekday {
    return controlArray.value[0].weekday;
  }

  public handleRadioButtonChange(toggle: boolean): void {
    //  set practice availability toggle
    this.addStaffForm.patchValue({ practiceAvailabilityToggle: toggle });
  }

  public selectWeekday(selectedWeekday: Weekday): void {
    if (this.formValues.selectedWeekday === selectedWeekday) {
      return;
    }

    // const { weekday } = this.formValues;
    this.addStaffForm.patchValue({ weekday: selectedWeekday });
    this.addPracticeAvailabilityControls();
  }

  public addSlot(controlArray: FormArray) {
    controlArray.push(this.getPracticeAvailabilityFormGroup(this.getFormArrayName(controlArray)));
  }

  public removeSlot(controlArray: FormArray, i: number) {
    controlArray.removeAt(i);
  }

  public saveStaff(): void {
    if (this.addStaffForm.invalid) {
      this.notificationSvc.showNotification('Form is not valid, please fill out the required fields.', NotificationType.WARNING);
      this.addStaffForm.updateValueAndValidity();
      // return;
    }

    const { practiceAvailabilityToggle, practiceAvailability, selectedWeekday, ...rest } = this.formValues;
    const addStaffReqData: AddStaffRequestData = {
      ...rest,
      practiceAvailability: [
        ...this.practiceAvailabilityControlsArray.reduce(
          (acc, formArray) => [
            ...acc,
            ...formArray.controls.reduce((a, control) => {
              if (control.value.dayStart && control.value.dayEnd) {
                return [...a, { ...control.value }];
              }
              return a;
            }, [] as PracticeAvailability[]),
          ],
          [] as PracticeAvailability[],
        ),
      ],
    };

    if (!addStaffReqData.info) {
      delete addStaffReqData.info;
    }
    if (!addStaffReqData.address) {
      delete addStaffReqData.address;
    }
    if (!addStaffReqData.practiceAvailability?.length) {
      delete addStaffReqData.practiceAvailability;
    }

    this.staffApiSvc
      .createStaff$(addStaffReqData)
      .pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.notificationSvc.showNotification('Staff added successfully');
        this.router.navigate(['../'], { relativeTo: this.route });
      });

    console.log(addStaffReqData);
  }
}
