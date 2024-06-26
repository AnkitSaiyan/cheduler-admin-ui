import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, Subject, combineLatest, startWith, switchMap, tap, catchError } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { PracticeAvailabilityServer } from '../../shared/models/practice.model';
import { TimeSlot } from '../../shared/models/calendar.model';
import { LoaderService } from './loader.service';

@Injectable({
	providedIn: 'root',
})
export class PracticeHoursApiService {
	private refreshPracticeHours$$ = new Subject<void>();

	constructor(private http: HttpClient, private loaderSvc: LoaderService, private utcToLocalPipe: UtcToLocalPipe) {}

	public get practiceHours$(): Observable<PracticeAvailabilityServer[]> {
		return combineLatest([this.refreshPracticeHours$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPractices$()));
	}

	public get practiceHoursWithTimeConversion$(): Observable<PracticeAvailabilityServer[]> {
		return combineLatest([this.refreshPracticeHours$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPracticesWithTimeConversion$()));
	}

	private fetchPractices$(): Observable<any> {
		this.loaderSvc.spinnerActivate();
		this.loaderSvc.activate();
		return this.http.get<BaseResponse<PracticeAvailabilityServer[]>>(`${environment.schedulerApiUrl}/practice`).pipe(
			map((response) => response.data),
			tap(() => {
				this.loaderSvc.deactivate();
				this.loaderSvc.spinnerDeactivate();
			}),
			catchError(() => of({})),
		);
	}

	private fetchPracticesWithTimeConversion$(): Observable<any> {
		this.loaderSvc.spinnerActivate();
		this.loaderSvc.activate();
		return this.http.get<BaseResponse<PracticeAvailabilityServer[]>>(`${environment.schedulerApiUrl}/practice`).pipe(
			map((response) =>
				response.data?.map((data) => ({
					...data,
					dayStart: this.utcToLocalPipe.transform(data.dayStart, true),
					dayEnd: this.utcToLocalPipe.transform(data.dayEnd, true),
				})),
			),
			tap(() => {
				this.loaderSvc.deactivate();
				this.loaderSvc.spinnerDeactivate();
			}),
			catchError(() => of({})),
		);
	}

	public savePracticeHours$(requestData: TimeSlot[]): Observable<PracticeAvailabilityServer[]> {
		this.loaderSvc.activate();
		return this.http.post<BaseResponse<PracticeAvailabilityServer[]>>(`${environment.schedulerApiUrl}/practice`, requestData).pipe(
			map((response) => response.data),
			tap(() => {
				this.refreshPracticeHours$$.next();
				this.loaderSvc.deactivate();
			}),
		);
	}
}
