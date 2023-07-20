import { Injectable } from '@angular/core';
import { combineLatest, BehaviorSubject, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { BaseResponse } from 'src/app/shared/models/base-response.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { DUTCH_BE, BodyType } from 'src/app/shared/utils/const';
import { Translate } from 'src/app/shared/models/translate.model';

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
			name: 'Male Body',
			value: BodyType.Male,
		},
		{
			name: 'Female Body',
			value: BodyType.Female,
		},
		{
			name: 'Skeleton',
			value: BodyType.Skeleton,
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
					map((downloadTypeItems) => {
						if (lang) {
							return downloadTypeItems.map((downloadType) => {
								return {
									...downloadType,
									name: Translate[downloadType.name][lang],
								};
							});
						}
						return downloadTypeItems;
					}),
				);
			}),
		);
	}

	public bodyPart$(gender?: BodyType): Observable<any[]> {
		return this.http.get('assets/json/category.json').pipe(
			switchMap((value: any) => {
				switch (gender) {
					case BodyType.Male:
						return of(
							[ ...value.maleBodyParts.front, ...value.maleBodyParts.back].sort().map((value) => ({ name: value, value })),
						);
					case BodyType.Female:
						return of(
							[ ...value.femaleBodyParts.front, ...value.femaleBodyParts.back].sort().map((value) => ({ name: value, value })),
						);

					case BodyType.Skeleton:
						return of(
							[...value.skeletonParts].sort().map((value) => ({ name: value, value })),
						);
					default:
						return of([]);
				}
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

	public get patient$(): Observable<any> {
		return combineLatest([this.refreshRooms$$.pipe(startWith(''))]).pipe(switchMap(() => this.fetchPatients()));
	}

	private fetchPatients(): Observable<any> {
		return this.http.get<BaseResponse<any>>(`${this.patientsUrl}`).pipe(
			map((response) => {
				return response['data'];
			}),
		);
	}
}
