import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner, MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import {
	NgbAccordionModule,
	NgbDatepickerModule,
	NgbDropdownModule,
	NgbModalModule,
	NgbPopoverModule,
	NgbTimepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { DesignSystemModule, NgDfmDropdownModule, TableModule } from 'diflexmo-angular-design';
import { MdbCarouselModule } from 'mdb-angular-ui-kit/carousel';
import { NgChartsModule } from 'ng2-charts';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ConfirmActionModalComponent } from './components/confirm-action-modal.component';
import { ConfirmStatusChangeBannerComponent } from './components/confirm-status-change-banner.component';
import { DestroyableComponent } from './components/destroyable.component';
import { DfmCalendarDayViewComponent } from './components/dfm-calendar/dfm-calendar-day-view/dfm-calendar-day-view.component';
import { DfmCalendarMonthViewComponent } from './components/dfm-calendar/dfm-calendar-month-view/dfm-calendar-month-view.component';
import { DfmCalendarWeekViewComponent } from './components/dfm-calendar/dfm-calendar-week-view/dfm-calendar-week-view.component';
import { DfmSpinnerComponent } from './components/dfm-spinner.component';
import { InputDropdownWrapperComponent } from './components/input-dropdown-wrapper.component';
import { SearchModalComponent } from './components/search-modal.component';
import { AppendTextToInputDirective } from './directives/append-text-to-input.directive';
import { EmailInputDirective } from './directives/email-input.directive';
import { NameInputDirective } from './directives/name-input.directive';
import { NumberInputDirective } from './directives/number-input.directive';
import { ApprovalTypeNamePipe } from './pipes/approval-type-name.pipe';
import { DashIfNothingPipe } from './pipes/dash-if-nothing.pipe';
import { JoinWithAndPipe } from './pipes/join-with-and.pipe';
import { LargestPipe } from './pipes/largest.pipe';
import { MonthToNamePipe } from './pipes/month-to-name.pipe';
import { NameValuePairPipe } from './pipes/name-value-pair.pipe';
import { NumberArrayPipe } from './pipes/number-array.pipe';
import { NumberToDatePipe } from './pipes/number-to-date.pipe';
import { RepeatTypeToNamePipe } from './pipes/repeat-type-to-name.pipe';
import { StatusNamePipe } from './pipes/status-name.pipe';
import { SumPipe } from './pipes/sum.pipe';
import { TimeInIntervalPipe } from './pipes/time-in-interval.pipe';
import { WeekdayToNamePipe } from './pipes/weekday-to-name.pipe';
// eslint-disable-next-line import/order
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
// eslint-disable-next-line import/order
import { DateAdapter, MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { CompleteProfileComponent } from './components/complete-profile/complete-profile.component';
import { DfmCalendarPickerComponent } from './components/dfm-calendar/dfm-calendar-picker/dfm-calendar-picker.component';
import { LoginFailedComponent } from './components/login-failed/login-failed.component';
import { MatSpinnerComponent } from './components/mat-spinner/mat-spinner.component';
import { TimeSlotsComponent } from './components/time-slots/time-slots.component';
import { IsPermittedDirective } from './directives/permission.directive';
import { DefaultDatePipe } from './pipes/default-date.pipe';
import { IsDataPipe } from './pipes/is-data.pipe';
import { MultiDropdownPlaceholderNamePipe } from './pipes/multi-dropdown-placeholder-name.pipe';
import { SortOrderValidation } from './pipes/remove-selected-item.pipe';
import { RoleNamePipe } from './pipes/role-name.pipe';
import { ShowSlotPercentagePipe } from './pipes/showSlotPercentage.pipe';
import { UserRolePipe } from './pipes/user-role.pipe';
import { UtcToLocalPipe } from './pipes/utc-to-local.pipe';
import { DUTCH_BE } from './utils/const';
import { CustomDatePickerAdapter } from './utils/date-adapter';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { IsPreviousDayPipe } from './pipes/is-previous-day.pipe';
import { DocumentViewModalComponent } from './components/document-view-modal/document-view-modal.component';
import { DfmDragEventDirective } from './directives/dfm-drag-event.directive';
import { DfmDragAreaEventDirective } from './directives/dfm-drag-area-event.directive';
import { SafePipe } from './pipes/safe.pipe';
import { FindSelectedSlotPipe } from './pipes/find-selected-slot.pipe';
import { RemoveDuplicateDataPipe } from './pipes/remove-duplicate-data.pipe';
import { DfmAutoScrollInViewDirective } from './directives/dfm-auto-scroll-in-view.directive';
import { RepeatFormComponent } from './components/repeat-form/repeat-form.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ShowBodyPartPipe } from './pipes/show-body-part.pipe';
import { SsnInputDirective } from './directives/ssn-input.directive';
import { ShareDataService } from '../core/services/share-data.service';
import { DfmTimeInputDropdownComponent } from './components/dfm-time-input-dropdown/dfm-time-input-dropdown.component';
import { MaxDatePipe } from './pipes/max-date.pipe';
import { MatExpansionModule } from '@angular/material/expansion';
import { WeekViewAppointmentCardTopPipe } from './pipes/weekview-appointment-card-top.pipe';
import { WeekViewAppointmentCardGroupHeightPipe } from './pipes/weekview-appointment-card-group-height.pipe';
import { DayViewAppointmentHeightPipe } from './pipes/day-view-appointment-height.pipe';
import { DayViewAppointmentTopPipe } from './pipes/day-view-appointment-top.pipe';
import { DayViewAbsenceHeightPipe } from './pipes/day-view-absence-height.pipe';
import { DayViewAbsenceTopPipe } from './pipes/day-view-absence-top.pipe';
import { DurationInMinutesPipe } from './pipes/duration-in-minutes.pipe';
import { WeekViewAbsenceTopPipe } from './pipes/week-view-absence-top.pipe';
import { TimeSlotsTableComponent } from './components/time-slots-table/time-slots-table.component';
import { DfmButtonTypeDirective } from './directives/dfm-button-type.directive';
import { PhoneNumberDirective } from './directives/phone-number.directive';

export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http);
}

@NgModule({
	declarations: [
		DestroyableComponent,
		StatusNamePipe,
		DashIfNothingPipe,
		ConfirmStatusChangeBannerComponent,
		WeekdayToNamePipe,
		InputDropdownWrapperComponent,
		ConfirmActionModalComponent,
		TimeInIntervalPipe,
		SearchModalComponent,
		DfmSpinnerComponent,
		MonthToNamePipe,
		JoinWithAndPipe,
		NameValuePairPipe,
		ApprovalTypeNamePipe,
		SumPipe,
		RepeatTypeToNamePipe,
		AppendTextToInputDirective,
		DfmCalendarMonthViewComponent,
		DfmCalendarWeekViewComponent,
		DfmCalendarDayViewComponent,
		DfmTimeInputDropdownComponent,
		NumberToDatePipe,
		LargestPipe,
		NameInputDirective,
		EmailInputDirective,
		NumberInputDirective,
		IsPermittedDirective,
		DfmDragEventDirective,
		DfmDragAreaEventDirective,
		DfmAutoScrollInViewDirective,
		NumberArrayPipe,
		IsPreviousDayPipe,
		IsDataPipe,
		TimeSlotsComponent,
		MatSpinnerComponent,
		RoleNamePipe,
		UserRolePipe,
		UtcToLocalPipe,
		DefaultDatePipe,
		ShowSlotPercentagePipe,
		CompleteProfileComponent,
		LoginFailedComponent,
		DfmCalendarPickerComponent,
		MultiDropdownPlaceholderNamePipe,
		ShowBodyPartPipe,
		SortOrderValidation,
		DocumentViewModalComponent,
		SafePipe,
		FindSelectedSlotPipe,
		RemoveDuplicateDataPipe,
		RepeatFormComponent,
		SsnInputDirective,
		MaxDatePipe,
		WeekViewAppointmentCardTopPipe,
		WeekViewAppointmentCardGroupHeightPipe,
		DayViewAppointmentHeightPipe,
		DayViewAppointmentTopPipe,
		DayViewAbsenceHeightPipe,
		DayViewAbsenceTopPipe,
		DurationInMinutesPipe,
		WeekViewAbsenceTopPipe,
		TimeSlotsTableComponent,
		DfmButtonTypeDirective,
  		PhoneNumberDirective,
	],
	imports: [
		CommonModule,
		DesignSystemModule,
		ReactiveFormsModule,
		NgbDropdownModule,
		NgDfmDropdownModule,
		NgbPopoverModule,
		NgbAccordionModule,
		MatProgressSpinnerModule,
		RouterLink,
		InfiniteScrollModule,
		TranslateModule.forChild({
			loader: {
				provide: TranslateLoader,
				// eslint-disable-next-line @typescript-eslint/no-use-before-define
				useFactory: HttpLoaderFactory,
				deps: [HttpClient],
			},
		}),
		NgOptimizedImage,
		MatDividerModule,
		MatProgressSpinnerModule,
		MatButtonModule,
		MatIconModule,
		MatNativeDateModule,
		MatDatepickerModule,
		MatMenuModule,
		MatSlideToggleModule,
		MatTabsModule,
		MatButtonToggleModule,
		MatExpansionModule,
	],
	exports: [
		DesignSystemModule,
		TableModule,
		NgChartsModule,
		MdbCarouselModule,
		NgbTimepickerModule,
		NgbModalModule,
		NgbDropdownModule,
		DashIfNothingPipe,
		StatusNamePipe,
		ConfirmStatusChangeBannerComponent,
		WeekdayToNamePipe,
		ConfirmActionModalComponent,
		TimeInIntervalPipe,
		SearchModalComponent,
		DfmSpinnerComponent,
		InputDropdownWrapperComponent,
		NgbDatepickerModule,
		MonthToNamePipe,
		JoinWithAndPipe,
		NameValuePairPipe,
		ShowBodyPartPipe,
		ApprovalTypeNamePipe,
		FindSelectedSlotPipe,
		SumPipe,
		RepeatTypeToNamePipe,
		IsPreviousDayPipe,
		SortOrderValidation,
		AppendTextToInputDirective,
		DfmCalendarMonthViewComponent,
		DfmCalendarWeekViewComponent,
		DfmCalendarDayViewComponent,
		DfmTimeInputDropdownComponent,
		NumberToDatePipe,
		NgbPopoverModule,
		NgbAccordionModule,
		LargestPipe,
		DragDropModule,
		NameInputDirective,
		EmailInputDirective,
		NumberInputDirective,
		IsPermittedDirective,
		DfmDragEventDirective,
		DfmDragAreaEventDirective,
		DfmAutoScrollInViewDirective,
		NumberArrayPipe,
		ClipboardModule,
		TranslateModule,
		IsDataPipe,
		TimeSlotsComponent,
		MatSpinnerComponent,
		RoleNamePipe,
		UserRolePipe,
		UtcToLocalPipe,
		DefaultDatePipe,
		ShowSlotPercentagePipe,
		MatProgressSpinner,
		MatButtonModule,
		MatIconModule,
		DfmCalendarPickerComponent,
		MatDatepickerModule,
		MultiDropdownPlaceholderNamePipe,
		MatMenuModule,
		InfiniteScrollModule,
		MatSlideToggleModule,
		RepeatFormComponent,
		MatTabsModule,
		MatButtonToggleModule,
		SsnInputDirective,
		MaxDatePipe,
		MatExpansionModule,
		WeekViewAppointmentCardTopPipe,
		WeekViewAppointmentCardGroupHeightPipe,
		DayViewAppointmentHeightPipe,
		DayViewAppointmentTopPipe,
		DayViewAbsenceHeightPipe,
		DayViewAbsenceTopPipe,
		DurationInMinutesPipe,
		WeekViewAbsenceTopPipe,
		TimeSlotsTableComponent,
		DfmButtonTypeDirective,
		PhoneNumberDirective,
	],
	providers: [
		TranslatePipe,
		{ provide: DateAdapter, useClass: CustomDatePickerAdapter, deps: [MAT_DATE_LOCALE] },
		{ provide: MAT_DATE_LOCALE, useValue: DUTCH_BE },
	],
})
export class SharedModule {
	constructor(private _adapter: DateAdapter<any>, private shareDataSvc: ShareDataService) {
		this.shareDataSvc.getLanguage$().subscribe((lang) => this._adapter.setLocale(lang));
	}
	static forRoot(): ModuleWithProviders<SharedModule> {
		return {
			ngModule: SharedModule,
		};
	}
}
