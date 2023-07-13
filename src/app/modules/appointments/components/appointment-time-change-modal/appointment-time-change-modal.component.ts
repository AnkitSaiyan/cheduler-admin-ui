import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { debounceTime, takeUntil } from 'rxjs';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalService } from '../../../../core/services/modal.service';
import { DestroyableComponent } from '../../../../shared/components/destroyable.component';
import { ShareDataService } from '../../../../core/services/share-data.service';
import { InputComponent } from 'diflexmo-angular-design';

interface FormValues {
  minutes: number;
  top: boolean;
}

@Component({
  selector: 'dfm-appointment-time-change-modal',
  templateUrl: './appointment-time-change-modal.component.html',
  styleUrls: ['./appointment-time-change-modal.component.scss'],
})
export class AppointmentTimeChangeModalComponent extends DestroyableComponent implements OnInit, OnDestroy {
  @HostListener('keyup.esc')
  private onKeyUp() {
    this.resetEventCard();
    this.scrollIntoView();
    this.setOverFlowNone();
  }

  public timeChangeForm!: FormGroup;

  public extend = true;

  private eventContainer!: HTMLDivElement;

  private readonly pixelPerMin = 4;

  private eventTop!: number;

  private eventHeight!: number;

  private positon! : boolean;

  private time! :number;

  constructor(private fb: FormBuilder, private modalSvc: ModalService, private shareDataSvc: ShareDataService) {
    super();
  }

  public ngOnInit(): void {
    this.createForm();

    this.modalSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data) => {
      this.extend = data?.extend;
      this.eventContainer = data?.eventContainer;
      this.positon = data.position;
      this.time = data?.time;

      if (this.eventContainer) {
        this.eventTop = +this.eventContainer.style.top.slice(0, -2);
        this.eventHeight = +this.eventContainer.style.height.slice(0, -2);

        this.setOverFlowNone();
        this.scrollIntoView();
      }
    });

    this.timeChangeForm?.valueChanges.pipe(debounceTime(0), takeUntil(this.destroy$$)).subscribe((formValues: FormValues) => {
      if (this.eventContainer) {
        this.adjustEventCard(+formValues.minutes, formValues.top);
      }
    });
    if(this.time)
      setTimeout(() => {
        this.timeChangeForm.patchValue({
          minutes: this.time ?? "",
          top: this.positon,
        })
      }, 0); 
    
  }

  public override ngOnDestroy() {
    super.ngOnDestroy();
  }

  private createForm() {
    this.timeChangeForm = this.fb.group({
      minutes: [null, [Validators.required]],
      top: [true, [Validators.required]],
    });
  }

  private get formValues(): FormValues {
    return this.timeChangeForm.value;
  }

  public close(result: boolean) {
    if (result && this.timeChangeForm.invalid) {
      this.timeChangeForm.markAsTouched();
      return;
    }

    if (!result) {
      this.resetEventCard();
      this.scrollIntoView();
      this.modalSvc.close();
      return;
    }

    this.modalSvc.close(this.formValues);
  }

  private adjustEventCard(minutes: number, isTop: boolean) {
    if (this.extend) {
      if (isTop) {
        this.eventContainer.style.top = `${Math.abs(this.eventTop - +minutes * this.pixelPerMin)}px`;
        this.eventContainer.style.height = `${Math.abs(this.eventHeight + +minutes * this.pixelPerMin)}px`;
      } else {
        this.resetEventCard();
        this.eventContainer.style.height = `${Math.abs(this.eventHeight + +minutes * this.pixelPerMin)}px`;
      }
    } else {
      const calculatedHeight = this.eventHeight - +minutes * this.pixelPerMin;

      if (calculatedHeight <= 0) {
        this.timeChangeForm.patchValue({ minutes: this.eventHeight / this.pixelPerMin }, { emitEvent: false });
      }

      if (isTop) {
        this.eventContainer.style.top = `${calculatedHeight >= 0 ? this.eventTop + +minutes * this.pixelPerMin : this.eventContainer.style.top}px`;
        this.eventContainer.style.height = `${calculatedHeight >= 0 ? calculatedHeight : 0}px`;
      } else {
        this.resetEventCard();
        this.eventContainer.style.height = `${calculatedHeight >= 0 ? calculatedHeight : 0}px`;
      }
    }

    setTimeout(() => this.scrollIntoView(), 0);
  }

  private resetEventCard() {
    this.eventContainer.style.top = `${this.eventTop}px`;
    this.eventContainer.style.height = `${this.eventHeight}px`;
  }

  private scrollIntoView() {
    this.eventContainer.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  private setOverFlowNone() {
    this.eventContainer.style.overflow = 'none';
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
}
