import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, debounceTime, map, startWith, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';
import { ABSENCE_TYPE_ARRAY } from 'src/app/shared/utils/const';
import { environment } from '../../../environments/environment';
import { Absence, AddAbsenceRequestData } from '../../shared/models/absence.model';
import { LoaderService } from './loader.service';

@Injectable({
	providedIn: 'root',
})
export class AbsenceApiService {
	private refreshAbsences$$ = new Subject<void>();

	private refreshAbsencesOnDashboard$$ = new Subject<void>();

	private pageNo$$ = new BehaviorSubject<number>(1);

	private pageNoOnDashboard$$ = new BehaviorSubject<number>(1);

	constructor(private http: HttpClient, private loaderSvc: LoaderService, private utcToLocalPipe: UtcToLocalPipe) {}

	public set pageNo(pageNo: number) {
		this.pageNo$$.next(pageNo);
	}

	public get pageNo(): number {
		return this.pageNo$$.value;
	}

	public set pageNoOnDashboard(pageNo: number) {
		this.pageNoOnDashboard$$.next(pageNo);
	}

	public get pageNoOnDashboard(): number {
		return this.pageNoOnDashboard$$.value;
	}

	public absences$(absenceType: (typeof ABSENCE_TYPE_ARRAY)[number]): Observable<BaseResponse<Absence[]>> {
		return combineLatest([this.pageNo$$, this.refreshAbsences$$.pipe(startWith(''))]).pipe(
			switchMap(([pageNo]) => this.fetchAllAbsence(pageNo, absenceType)),
		);
	}

	public absencesForCalendar$(
		absenceType: (typeof ABSENCE_TYPE_ARRAY)[number],
		fromDate: string,
		toDate: string,
	): Observable<BaseResponse<Absence[]>> {
		return combineLatest([this.refreshAbsences$$.pipe(startWith(''))]).pipe(
			debounceTime(100),

			switchMap(() => this.fetchAllAbsenceForCalendar(absenceType, fromDate, toDate)),
		);
	}

	public absencesHolidayForCalendar$(fromDate: string, toDate: string): Observable<BaseResponse<Absence[]>> {
		return combineLatest([this.refreshAbsences$$.pipe(startWith(''))]).pipe(
			debounceTime(100),

			switchMap(() => this.fetchAllAbsenceHolidayForCalendar(fromDate, toDate)),
		);
	}

	public get absencesOnDashboard$(): Observable<BaseResponse<Absence[]>> {
		return combineLatest([this.pageNoOnDashboard$$, this.refreshAbsencesOnDashboard$$.pipe(startWith(''))]).pipe(
			switchMap(([pageNo]) => this.fetchAllAbsence(pageNo)),
		);
	}

	public getAbsenceByID$(absenceID: number): Observable<Absence> {
		this.loaderSvc.spinnerActivate();
		return combineLatest([this.refreshAbsences$$.pipe(startWith(''))]).pipe(
			switchMap(() => this.fetchAbsenceById(absenceID)),
			tap(() => this.loaderSvc.spinnerDeactivate()),
		);
	}

	public deleteAbsence$(absenceID: number): Observable<boolean> {
		this.loaderSvc.activate();
		return this.http.delete<BaseResponse<boolean>>(`${environment.schedulerApiUrl}/absences/${absenceID}`).pipe(
			map((response) => response.data),
			tap(() => {
				this.loaderSvc.deactivate();
			}),
		);
	}

	public addNewAbsence$(requestData: AddAbsenceRequestData): Observable<Absence> {
		this.loaderSvc.activate();
		const { id, ...restdata } = requestData;
		return this.http.post<BaseResponse<Absence>>(`${environment.schedulerApiUrl}/absences`, restdata).pipe(
			map((response) => ({
				...response.data,
				startedAt: this.utcToLocalPipe.transform(response?.data?.startedAt, false, true),
				endedAt: this.utcToLocalPipe.transform(response?.data?.endedAt, false, true),
			})),
			tap(() => {
				this.pageNo$$.next(1);
				this.pageNoOnDashboard$$.next(1);
				this.refreshAbsences$$.next();
				this.loaderSvc.deactivate();
			}),
		);
	}

	public updateAbsence(requestData: AddAbsenceRequestData): Observable<Absence> {
		this.loaderSvc.activate();
		const { id, ...restData } = requestData;
		return this.http.put<BaseResponse<Absence>>(`${environment.schedulerApiUrl}/absences/${id}`, restData).pipe(
			map((response) => ({
				...response.data,
				startedAt: this.utcToLocalPipe.transform(response?.data?.startedAt, false, true),
				endedAt: this.utcToLocalPipe.transform(response?.data?.endedAt, false, true),
			})),
			tap(() => {
				this.pageNo$$.next(1);
				this.pageNoOnDashboard$$.next(1);
				this.refreshAbsences$$.next();
				this.loaderSvc.deactivate();
			}),
		);
	}

	private fetchAllAbsence(pageNo: number, absenceType?: (typeof ABSENCE_TYPE_ARRAY)[number]): Observable<BaseResponse<Absence[]>> {
		this.loaderSvc.activate();
		const params = new HttpParams().append('pageNo', pageNo);
		if (!absenceType) {
			return this.http
				.get<BaseResponse<Absence[]>>(`${environment.schedulerApiUrl}/absences`, { params })
				.pipe(tap(() => this.loaderSvc.deactivate()));
		}
		if (absenceType === ABSENCE_TYPE_ARRAY[0]) {
			return this.http
				.get<BaseResponse<Absence[]>>(`${environment.schedulerApiUrl}/absences/getroomabsencelist`, { params })
				.pipe(tap(() => this.loaderSvc.deactivate()));
		}
		if (absenceType === ABSENCE_TYPE_ARRAY[1]) {
			return this.http
				.get<BaseResponse<Absence[]>>(`${environment.schedulerApiUrl}/absences/getstaffabsencelist`, { params })
				.pipe(tap(() => this.loaderSvc.deactivate()));
		}
		return this.http
			.get<BaseResponse<Absence[]>>(`${environment.schedulerApiUrl}/absences/getholidaylist`, { params })
			.pipe(tap(() => this.loaderSvc.deactivate()));
	}

	private fetchAllAbsenceForCalendar(
		absenceType: (typeof ABSENCE_TYPE_ARRAY)[number],
		fromDate: string,
		toDate: string,
	): Observable<BaseResponse<Absence[]>> {
		this.loaderSvc.activate();
		const params = { toDate, fromDate };
		if (absenceType === 'rooms') {
			return this.http
				.get<BaseResponse<Absence[]>>(`${environment.schedulerApiUrl}/absences/getroomabsence`, { params })
				.pipe(tap(() => this.loaderSvc.deactivate()));
		}
		return this.http
			.get<BaseResponse<Absence[]>>(`${environment.schedulerApiUrl}/absences/getstaffabsence`, { params })
			.pipe(tap(() => this.loaderSvc.deactivate()));
	}

	private fetchAllAbsenceHolidayForCalendar(fromDate: string, toDate: string): Observable<BaseResponse<Absence[]>> {
		this.loaderSvc.activate();
		const params = { toDate, fromDate };
		return this.http
			.get<BaseResponse<Absence[]>>(`${environment.schedulerApiUrl}/common/getholidaylist`, { params })
			.pipe(tap(() => this.loaderSvc.deactivate()));
	}

	private fetchAbsenceById(absenceID: number): Observable<Absence> {
		this.loaderSvc.activate();
		return this.http.get<BaseResponse<Absence>>(`${environment.schedulerApiUrl}/absences/${absenceID}`).pipe(
			map((response) => ({
				...response.data,
				startedAt: response?.data.isHoliday ? response?.data?.startedAt : this.utcToLocalPipe.transform(response?.data?.startedAt, false, true),
				endedAt: response?.data.isHoliday ? response?.data?.endedAt : this.utcToLocalPipe.transform(response?.data?.endedAt, false, true),
			})),
			tap(() => this.loaderSvc.deactivate()),
		);
	}
}
