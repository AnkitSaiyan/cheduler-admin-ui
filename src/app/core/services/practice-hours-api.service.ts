import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of, Subject, combineLatest, startWith, switchMap, tap, catchError } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { PracticeAvailabilityServer } from '../../shared/models/practice.model';
import { TimeSlot } from '../../shared/models/calendar.model';
import { LoaderService } from './loader.service';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { DateTimeUtils } from 'src/app/shared/utils/date-time.utils';

@Injectable({
	providedIn: 'root',
})
export class PracticeHoursApiService {
	private refreshPracticeHours$$ = new Subject<void>();

	constructor(private http: HttpClient, private loaderSvc: LoaderService, private utcToLocalPipe: UtcToLocalPipe) {}

	public get practiceHours$(): Observable<PracticeAvailabilityServer[]> {
		return combineLatest([this.refreshPracticeHours$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPractices$()));
	}

	private fetchPractices$(): Observable<any> {
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
			catchError((error) => of({})),
		);
	}

	public savePracticeHours$(requestData: TimeSlot[]): Observable<PracticeAvailabilityServer[]> {
		const payload = requestData.map((data) => ({
			...data,
			dayStart: DateTimeUtils.LocalToUTCTimeTimeString(data.dayStart),
			dayEnd: DateTimeUtils.LocalToUTCTimeTimeString(data.dayEnd),
		}));
		this.loaderSvc.activate();
		return this.http.post<BaseResponse<PracticeAvailabilityServer[]>>(`${environment.schedulerApiUrl}/practice`, payload).pipe(
			map((response) => response.data),
			tap(() => {
				this.refreshPracticeHours$$.next();
				this.loaderSvc.deactivate();
			}),
		);
	}
}
