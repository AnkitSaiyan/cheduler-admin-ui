import { Injectable } from '@angular/core';
import { combineLatest, BehaviorSubject, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { DUTCH_BE, BodyType } from 'src/app/shared/utils/const';
import { Translate } from 'src/app/shared/models/translate.model';
import { NameValue } from 'src/app/shared/components/search-modal.component';
import { AppointmentStatus } from 'src/app/shared/models/status.model';

@Injectable({
	providedIn: 'root',
})
export class ShareDataService {
	private changeTimeModalData$$ = new BehaviorSubject<any>(null);

	private date$$ = new BehaviorSubject<any>(null);

	private language$$ = new BehaviorSubject<string>(DUTCH_BE);

	private refreshRooms$$ = new Subject<void>();

	private readonly patientsUrl = `${environment.schedulerApiUrl}/common/getpatients`;

	private bodyType: { name: string; value: string }[] = [
		{
			name: 'MaleBody',
			value: BodyType.Male,
		},
		{
			name: 'FemaleBody',
			value: BodyType.Female,
		},
		// {
		// 	name: 'Skeleton',
		// 	value: BodyType.Skeleton,
		// },
	];

	public statuses: NameValue[] = [
		{
			name: 'Pending',
			value: AppointmentStatus.Pending,
		},
		{
			name: 'Approved',
			value: AppointmentStatus.Approved,
		},
		{
			name: 'Cancelled',
			value: AppointmentStatus.Cancelled,
		},
	];

	constructor(private http: HttpClient) {
		if (localStorage.getItem('lang')) {
			this.language$$.next(localStorage.getItem('lang') ?? '');
		}
	}

	public getChangeTimeModalData$(): Observable<any> {
		return this.changeTimeModalData$$.asObservable();
	}

	get bodyType$(): Observable<any[]> {
		return combineLatest([this.language$$.pipe(startWith(''))]).pipe(
			switchMap(([lang]) => {
				return of(this.bodyType).pipe(
					map((bodyTypes) => {
						if (lang) {
							return bodyTypes.map((bodyType) => {
								return {
									...bodyType,
									name: Translate[bodyType.name][lang],
								};
							});
						}
						return bodyTypes;
					}),
				);
			}),
		);
	}

	get AppointmentStatus$(): Observable<any[]> {
		return combineLatest([this.language$$.pipe(startWith(''))]).pipe(
			switchMap(([lang]) => {
				return of(this.statuses).pipe(
					map((statuses) => {
						if (lang) {
							return statuses.map((val) => {
								return {
									...val,
									name: Translate.AppointmentStatus[val.name][lang],
								};
							});
						}
						return statuses;
					}),
				);
			}),
		);
	}

	public setChangeTimeModalData(data: any) {
		this.changeTimeModalData$$.next(data);
	}

	public getDate$(): Observable<Date> {
		return this.date$$.asObservable();
	}

	public setDate(date: Date) {
		this.date$$.next(date);
	}

	public setLanguage(languge: string) {
		localStorage.setItem('lang', languge);
		this.language$$.next(languge);
	}

	public getLanguage$(): Observable<string> {
		return this.language$$.asObservable();
	}

	public getLanguage(): string {
		return this.language$$.value;
	}

	public get patient$(): Observable<any> {
		return combineLatest([this.refreshRooms$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPatients()));
	}

	private fetchPatients(): Observable<any> {
		return this.http.get<BaseResponse<any>>(`${this.patientsUrl}`).pipe(
			map((response) => {
				return response.data;
			}),
		);
	}
}
