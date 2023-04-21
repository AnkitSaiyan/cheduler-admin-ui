import {Injectable} from '@angular/core';
import {combineLatest, map, Observable, startWith, Subject, switchMap, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {BaseResponse} from 'src/app/shared/models/base-response.model';
import {Absence, AddAbsenceRequestDate} from '../../shared/models/absence.model';
import {environment} from '../../../environments/environment';
import {LoaderService} from './loader.service';
import { DateTimeUtils } from 'src/app/shared/utils/date-time.utils';
import { UtcToLocalPipe } from 'src/app/shared/pipes/utc-to-local.pipe';

@Injectable({
	providedIn: 'root',
})
export class AbsenceApiService {
	private refreshAbsences$$ = new Subject<void>();

	constructor(private http: HttpClient, private loaderSvc: LoaderService, private utcToLocalPipe: UtcToLocalPipe) {}

	public get absences$(): Observable<Absence[]> {
		return combineLatest([this.refreshAbsences$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchAllAbsence()));
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
				this.refreshAbsences$$.next();
				this.loaderSvc.deactivate();
			}),
		);
	}

	public addNewAbsence$(requestData: AddAbsenceRequestDate): Observable<Absence> {
		const payload: AddAbsenceRequestDate = {
			...requestData,
			startedAt: DateTimeUtils.LocalDateToUTCDate(new Date(requestData.startedAt)).toISOString(),
			endedAt: DateTimeUtils.LocalDateToUTCDate(new Date(requestData.endedAt)).toISOString(),
		};

		this.loaderSvc.activate();
		const { id, ...restdata } = payload;
		console.log(payload, restdata);
		return this.http.post<BaseResponse<Absence>>(`${environment.schedulerApiUrl}/absences`, restdata).pipe(
			map((response) => ({
				...response.data,
				startedAt: this.utcToLocalPipe.transform(response?.data?.startedAt),
				endedAt: this.utcToLocalPipe.transform(response?.data?.endedAt),
			})),
			tap(() => {
				this.refreshAbsences$$.next();
				this.loaderSvc.deactivate();
			}),
		);
	}

	public updateAbsence(requestData: AddAbsenceRequestDate): Observable<Absence> {
		const { id, ...restData } = requestData;
		const payload: AddAbsenceRequestDate = {
			...restData,
			startedAt: DateTimeUtils.LocalDateToUTCDate(new Date(restData.startedAt)).toISOString(),
			endedAt: DateTimeUtils.LocalDateToUTCDate(new Date(requestData.endedAt)).toISOString(),
		};
		this.loaderSvc.activate();

		return this.http.put<BaseResponse<Absence>>(`${environment.schedulerApiUrl}/absences/${id}`, payload).pipe(
			map((response) => ({
				...response.data,
				startedAt: this.utcToLocalPipe.transform(response?.data?.startedAt),
				endedAt: this.utcToLocalPipe.transform(response?.data?.endedAt),
			})),
			tap(() => {
				this.refreshAbsences$$.next();
				this.loaderSvc.deactivate();
			}),
		);
	}

	private fetchAllAbsence(): Observable<Absence[]> {
		this.loaderSvc.activate();
		return this.http.get<BaseResponse<Absence[]>>(`${environment.schedulerApiUrl}/absences`).pipe(
			map((response) => response.data),
			tap(() => this.loaderSvc.deactivate()),
		);
	}

	private fetchAbsenceById(absenceID: number): Observable<Absence> {
		this.loaderSvc.activate();
		return this.http.get<BaseResponse<Absence>>(`${environment.schedulerApiUrl}/absences/${absenceID}`).pipe(
			map((response) => ({
				...response.data,
				startedAt: this.utcToLocalPipe.transform(response?.data?.startedAt),
				endedAt: this.utcToLocalPipe.transform(response?.data?.endedAt),
			})),
			tap(() => this.loaderSvc.deactivate()),
		);
	}
}
